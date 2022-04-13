import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
  realmDiamondAddress,
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
  genUpgradeInstallationSignature,
} from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress("mainnet"));
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
      g.tileAddress
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
  it("Claim Alchemica", async function () {
    const preBalance = await g.fud.balanceOf(testAddress);
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    const alchemicaRemaining = await g.alchemicaFacet.getRealmAlchemica(
      testParcelId
    );
    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256", "uint256"],
      [0, testParcelId, testGotchiId, alchemicaRemaining[0]]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);

    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      testGotchiId,
      signature
    );
    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );

    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId, 0);

    //50% of Alchemica goes directly to wallet, due to spillover
    const alchemicaMinusSpillover = 0.5;
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    let totalAlchemica = await g.fud.balanceOf(testAddress);
    expect(
      Number(ethers.utils.formatUnits(totalAlchemica)) -
        Number(ethers.utils.formatUnits(preBalance))
    ).to.equal(
      alchemicaMinusSpillover * Number(ethers.utils.formatUnits(parcelCapacity))
    );
  });
  it("Equip level 2 Reservoir and claim alchemica", async function () {
    //Equip Level 1 Reservoir
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      10,
      10,
      await genEquipInstallationSignature(testParcelId, 2, 10, 10)
    );

    //Upgrade to Level 2 Reservoir
    const coordinateX = 3;
    const coordinateY = 3;
    const installationId = 2;
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX,
      coordinateY,
      installationId,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    const signature = await genUpgradeInstallationSignature(
      testParcelId,
      coordinateX,
      coordinateY,
      installationId
    );
    await g.installationDiamond.upgradeInstallation(upgradeQueue, signature);

    await mineBlocks(ethers, 20000);

    await network.provider.send("evm_increaseTime", [3600 * 8]);
    await network.provider.send("evm_mine");

    const alchemicaRemaining = await g.alchemicaFacet.getRealmAlchemica(
      testParcelId
    );
    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      testGotchiId,
      await genClaimAlchemicaSignature(
        testParcelId,
        testGotchiId,
        alchemicaRemaining[0]
      )
    );
    let startBalance = await g.fud.balanceOf(testAddress);
    await g.installationAdminFacet.finalizeUpgrade();
    await mineBlocks(ethers, 60000);

    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId, 0);
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      Number(ethers.utils.formatUnits(parcelCapacity))
    );

    await network.provider.send("evm_increaseTime", [3600 * 8]);
    await network.provider.send("evm_mine");

    const alchemicaRemaining2 = await g.alchemicaFacet.getRealmAlchemica(
      testParcelId
    );

    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      testGotchiId,
      await genClaimAlchemicaSignature(
        testParcelId,
        testGotchiId,
        alchemicaRemaining2[0]
      )
    );

    let claimedAlchemica = await g.fud.balanceOf(testAddress);

    //combined spillover of reservoirs is 30%
    const alchemicaMinusSpillover = 0.7;

    expect(
      Number(ethers.utils.formatUnits(claimedAlchemica)) -
        Number(ethers.utils.formatUnits(startBalance))
    ).to.equal(
      alchemicaMinusSpillover * Number(ethers.utils.formatUnits(parcelCapacity))
    );
  });
  it("Test unequipping", async function () {
    await mineBlocks(ethers, 5000);

    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    const harvester = await g.installationDiamond.getInstallationType(5);
    const harvesterFudCost = harvester.alchemicaCost[0];
    const balancePre = await g.fud.balanceOf(testAddress);
    await g.realmFacet.unequipInstallation(
      testParcelId,
      5,
      15,
      15,
      await genEquipInstallationSignature(testParcelId, 5, 15, 15)
    );
    const balancePost = await g.fud.balanceOf(testAddress);
    expect(Number(ethers.utils.formatUnits(balancePost))).to.equal(
      Number(ethers.utils.formatUnits(balancePre)) +
        Number(ethers.utils.formatUnits(harvesterFudCost)) / 2
    );
    await expect(
      g.realmFacet.unequipInstallation(
        testParcelId,
        2,
        10,
        10,
        await genEquipInstallationSignature(testParcelId, 2, 10, 10)
      )
    ).to.be.revertedWith(
      "LibAlchemica: Unclaimed alchemica greater than reservoir capacity"
    );

    let alchemicaRemaining = await g.alchemicaFacet.getRealmAlchemica(
      testParcelId
    );

    await network.provider.send("evm_increaseTime", [3600 * 8]);
    await network.provider.send("evm_mine");

    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      testGotchiId,
      await genClaimAlchemicaSignature(
        testParcelId,
        testGotchiId,
        alchemicaRemaining[0]
      )
    );

    await network.provider.send("evm_increaseTime", [3600 * 8]);
    await network.provider.send("evm_mine");

    alchemicaRemaining = await g.alchemicaFacet.getRealmAlchemica(testParcelId);

    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      testGotchiId,
      await genClaimAlchemicaSignature(
        testParcelId,
        testGotchiId,
        alchemicaRemaining[0]
      )
    );

    await g.realmFacet.unequipInstallation(
      testParcelId,
      3,
      3,
      3,
      await genEquipInstallationSignature(testParcelId, 3, 3, 3)
    );
    await g.realmFacet.unequipInstallation(
      testParcelId,
      2,
      10,
      10,
      await genEquipInstallationSignature(testParcelId, 2, 10, 10)
    );
  });
  it("Test unequipping reduceTraits loop", async function () {
    const reservoirLevel1Capacity = 500;
    await expect(
      g.alchemicaFacet.calculateSpilloverForReservoir(testParcelId, 0)
    ).to.be.revertedWith("AlchemicaFacet: no reservoirs equipped");
    const capacityPre = await g.realmFacet.getParcelCapacity(testParcelId, 0);
    expect(Number(ethers.utils.formatUnits(capacityPre))).to.equal(0);
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      3,
      3,
      await genEquipInstallationSignature(testParcelId, 2, 3, 3)
    );
    const capacityPreOneReservoir = await g.realmFacet.getParcelCapacity(
      testParcelId,
      0
    );
    expect(Number(ethers.utils.formatUnits(capacityPreOneReservoir))).to.equal(
      reservoirLevel1Capacity
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      6,
      6,
      await genEquipInstallationSignature(testParcelId, 2, 6, 6)
    );
    const capacityPreTwoReservoir = await g.realmFacet.getParcelCapacity(
      testParcelId,
      0
    );
    expect(Number(ethers.utils.formatUnits(capacityPreTwoReservoir))).to.equal(
      reservoirLevel1Capacity * 2
    );
    await g.realmFacet.unequipInstallation(
      testParcelId,
      2,
      3,
      3,
      await genEquipInstallationSignature(testParcelId, 2, 3, 3)
    );
    const capacityPostOneReservoir = await g.realmFacet.getParcelCapacity(
      testParcelId,
      0
    );
    expect(Number(ethers.utils.formatUnits(capacityPostOneReservoir))).to.equal(
      reservoirLevel1Capacity
    );
    await g.realmFacet.unequipInstallation(
      testParcelId,
      2,
      6,
      6,
      await genEquipInstallationSignature(testParcelId, 2, 6, 6)
    );
    const capacityPost = await g.realmFacet.getParcelCapacity(testParcelId, 0);
    expect(Number(ethers.utils.formatUnits(capacityPost))).to.equal(0);
  });
});
