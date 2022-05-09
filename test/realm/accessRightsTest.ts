import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
  realmDiamondAddress,
  maticAavegotchiDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { TestBeforeVars, UpgradeQueue } from "../../types";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  approveAlchemica,
  beforeTest,
  mintAlchemica,
  genClaimAlchemicaSignature,
  genEquipInstallationSignature,
  testInstallations,
  genChannelAlchemicaSignature,
} from "../../scripts/realm/realmHelpers";
import { AavegotchiDiamond } from "../../typechain";

describe("Access rights test", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testAddress2 = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const testParcelId = 2893;
  const testGotchiId = 22306;
  const testGotchiId2 = 4189;
  const notOwnedGotchi = 19095;

  let g: TestBeforeVars;
  let aavegotchiDiamond;

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress("mainnet"));

    aavegotchiDiamond = (await ethers.getContractAt(
      "AavegotchiDiamond",
      maticAavegotchiDiamondAddress
    )) as AavegotchiDiamond;
  });
  it("Deploy alchemica ERC20s", async function () {
    g.alchemicaFacet = await impersonate(
      g.ownerAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    await g.alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      g.installationsAddress,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [g.fud.address, g.fomo.address, g.alpha.address, g.kek.address],
      g.gltr.address,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      g.ownerAddress,
      g.tileAddress,
      maticAavegotchiDiamondAddress
    );
    await network.provider.send("hardhat_setBalance", [
      maticDiamondAddress,
      "0x1000000000000000",
    ]);
  });
  it("Setup installation diamond", async function () {
    g.installationDiamond = await impersonate(
      g.installationOwner,
      g.installationDiamond,
      ethers,
      network
    );

    let installationsTypes = await g.installationDiamond.getInstallationTypes(
      []
    );

    await g.installationAdminFacet.addInstallationTypes(testInstallations());
    installationsTypes = await g.installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(testInstallations().length);
  });
  it("Craft installations and equip altar", async function () {
    g.installationDiamond = await impersonate(
      testAddress,
      g.installationDiamond,
      ethers,
      network
    );
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );

    await expect(
      g.installationDiamond.craftInstallations([1, 2, 2])
    ).to.be.revertedWith("ERC20: insufficient allowance");

    await mintAlchemica(
      g,
      ethers,
      g.alchemicaOwner,
      testAddress,
      network,
      ethers.utils.parseUnits("50000")
    );
    await approveAlchemica(g, ethers, testAddress, network);

    await g.fud.transfer(
      realmDiamondAddress("mainnet"),
      ethers.utils.parseUnits("5000")
    );
    await g.fomo.transfer(
      realmDiamondAddress("mainnet"),
      ethers.utils.parseUnits("5000")
    );
    await g.alpha.transfer(
      realmDiamondAddress("mainnet"),
      ethers.utils.parseUnits("5000")
    );
    await g.kek.transfer(
      realmDiamondAddress("mainnet"),
      ethers.utils.parseUnits("5000")
    );

    let fudPreCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraft = await g.kek.balanceOf(maticDiamondAddress);
    await g.installationDiamond.craftInstallations([1, 5, 2, 2, 2, 2]);
    let fudAfterCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekAfterCraft = await g.kek.balanceOf(maticDiamondAddress);
    expect(Number(ethers.utils.formatUnits(fudAfterCraft))).to.above(
      Number(ethers.utils.formatUnits(fudPreCraft))
    );
    expect(Number(ethers.utils.formatUnits(kekAfterCraft))).to.above(
      Number(ethers.utils.formatUnits(kekPreCraft))
    );
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: Installation not ready");

    g.gltr = await impersonate(testAddress, g.gltr, ethers, network);
    await g.gltr.mint(ethers.utils.parseUnits("100000"));
    await g.gltr.approve(
      g.installationDiamond.address,
      ethers.utils.parseUnits("100000")
    );
    await g.installationDiamond.reduceCraftTime([0], [100]);
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: Installation not ready");
    await g.installationDiamond.reduceCraftTime([0], [10000]);
    await g.installationDiamond.claimInstallations([0]);

    await mineBlocks(ethers, 21000);

    const erc1155facet = await ethers.getContractAt(
      "ERC1155Facet",
      g.installationsAddress
    );

    const balancePre = await erc1155facet.balanceOf(testAddress, 2);
    await g.installationDiamond.claimInstallations([1, 2, 3, 4, 5]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);

    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      1,
      0,
      0,
      await genEquipInstallationSignature(testParcelId, 1, 0, 0)
    );
  });
  it("Survey Parcel", async function () {
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Equip installations", async function () {
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      3,
      3,
      await genEquipInstallationSignature(testParcelId, 2, 3, 3)
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      5,
      15,
      15,
      await genEquipInstallationSignature(testParcelId, 5, 15, 15)
    );
    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );

    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    await mineBlocks(ethers, 60000);

    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId, 0);
    availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );

    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      Number(ethers.utils.formatUnits(parcelCapacity))
    );
  });
  it("Channel alchemica any gotchi", async function () {
    g.alchemicaFacet = await impersonate(
      testAddress2,
      g.alchemicaFacet,
      ethers,
      network
    );

    let lastChanneled = await g.alchemicaFacet.getLastChanneled(notOwnedGotchi);

    let signature = await genChannelAlchemicaSignature(
      testParcelId,
      notOwnedGotchi,
      lastChanneled
    );

    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        notOwnedGotchi,
        lastChanneled,
        signature
      )
    ).to.be.revertedWith("AlchemicaFacet: Only Parcel owner can channel");

    await g.realmFacet.setParcelsAccessRights([testParcelId], [0], [2]);

    lastChanneled = await g.alchemicaFacet.getLastChanneled(notOwnedGotchi);

    signature = await genChannelAlchemicaSignature(
      testParcelId,
      notOwnedGotchi,
      lastChanneled
    );

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      notOwnedGotchi,
      lastChanneled,
      signature
    );
  });
  it("Claim Alchemica any gotchi", async function () {
    g.alchemicaFacet = await impersonate(
      testAddress2,
      g.alchemicaFacet,
      ethers,
      network
    );

    const alchemicaRemaining = await g.alchemicaFacet.getRealmAlchemica(
      testParcelId
    );

    let signature = await genClaimAlchemicaSignature(
      testParcelId,
      notOwnedGotchi,
      alchemicaRemaining[0]
    );

    await expect(
      g.alchemicaFacet.claimAvailableAlchemica(
        testParcelId,
        [0],
        notOwnedGotchi,
        signature
      )
    ).to.be.revertedWith("AlchemicaFacet: Only Parcel owner can claim");

    await g.realmFacet.setParcelsAccessRights([testParcelId], [1], [2]);

    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      notOwnedGotchi,
      signature
    );
  });
  it("Channel alchemica borrowed gotchi", async function () {
    await network.provider.send("evm_increaseTime", [86400]);

    g.alchemicaFacet = await impersonate(
      testAddress2,
      g.alchemicaFacet,
      ethers,
      network
    );

    aavegotchiDiamond = await impersonate(
      testAddress,
      aavegotchiDiamond,
      ethers,
      network
    );

    await g.realmFacet.setParcelsAccessRights([testParcelId], [0], [1]);

    let lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    let signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        testGotchiId,
        lastChanneled,
        signature
      )
    ).to.be.revertedWith(
      "AlchemicaFacet: Only Parcel owner/borrower can channel"
    );

    await aavegotchiDiamond.addGotchiLending(
      testGotchiId,
      0,
      1,
      [50, 50, 0],
      testAddress,
      ethers.constants.AddressZero,
      0,
      []
    );

    aavegotchiDiamond = await impersonate(
      testAddress2,
      aavegotchiDiamond,
      ethers,
      network
    );

    const lending = await aavegotchiDiamond.getGotchiLendingFromToken(
      testGotchiId
    );

    await aavegotchiDiamond.agreeGotchiLending(
      lending.listingId,
      lending.erc721TokenId,
      lending.initialCost,
      lending.period,
      lending.revenueSplit
    );

    lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      signature
    );
  });
  it("Claim alchemica borrowed gotchi", async function () {
    await g.realmFacet.setParcelsAccessRights([testParcelId], [1], [1]);

    const alchemicaRemaining = await g.alchemicaFacet.getRealmAlchemica(
      testParcelId
    );

    let signature = await genClaimAlchemicaSignature(
      testParcelId,
      testGotchiId2,
      alchemicaRemaining[0]
    );

    await expect(
      g.alchemicaFacet.claimAvailableAlchemica(
        testParcelId,
        [0],
        testGotchiId2,
        signature
      )
    ).to.be.revertedWith(
      "AlchemicaFacet: Only Parcel owner/borrower can claim"
    );

    aavegotchiDiamond = await impersonate(
      testAddress,
      aavegotchiDiamond,
      ethers,
      network
    );

    await aavegotchiDiamond.addGotchiLending(
      testGotchiId2,
      0,
      1,
      [50, 50, 0],
      testAddress,
      ethers.constants.AddressZero,
      0,
      []
    );

    aavegotchiDiamond = await impersonate(
      testAddress2,
      aavegotchiDiamond,
      ethers,
      network
    );

    const lending = await aavegotchiDiamond.getGotchiLendingFromToken(
      testGotchiId2
    );

    await aavegotchiDiamond.agreeGotchiLending(
      lending.listingId,
      lending.erc721TokenId,
      lending.initialCost,
      lending.period,
      lending.revenueSplit
    );

    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      testGotchiId2,
      signature
    );
  });
});
