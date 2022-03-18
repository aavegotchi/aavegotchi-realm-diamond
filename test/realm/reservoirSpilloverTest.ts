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
  beforeTest,
  testInstallations,
} from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;

  let g: TestBeforeVars;

  const genSignature = async (tileId: number, x: number, y: number) => {
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    let messageHash1 = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256", "uint256"],
      [testParcelId, tileId, x, y]
    );
    let signedMessage1 = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash1)
    );
    let signature1 = ethers.utils.arrayify(signedMessage1);

    return signature1;
  };

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress(network.name));
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
      g.glmr.address,
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
  it("Craft installations", async function () {
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
    await g.alchemicaFacet.testingAlchemicaFaucet(
      0,
      ethers.utils.parseUnits("20000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      1,
      ethers.utils.parseUnits("300")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      2,
      ethers.utils.parseUnits("300")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      3,
      ethers.utils.parseUnits("300")
    );
    g.fud = await impersonate(testAddress, g.fud, ethers, network);
    g.fomo = await impersonate(testAddress, g.fomo, ethers, network);
    g.alpha = await impersonate(testAddress, g.alpha, ethers, network);
    g.kek = await impersonate(testAddress, g.kek, ethers, network);
    g.fud.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    await g.fud.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.fomo.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.alpha.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.kek.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    let fudPreCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraft = await g.kek.balanceOf(maticDiamondAddress);
    await g.installationDiamond.craftInstallations([1, 2, 2]);
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
    ).to.be.revertedWith("InstallationFacet: installation not ready");

    g.glmr = await impersonate(testAddress, g.glmr, ethers, network);
    await g.glmr.mint(ethers.utils.parseUnits("100000"));
    await g.glmr.approve(
      g.installationDiamond.address,
      ethers.utils.parseUnits("100000")
    );
    await g.installationDiamond.reduceCraftTime([0], [100]);
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    await g.installationDiamond.reduceCraftTime([0], [10000]);
    await g.installationDiamond.claimInstallations([0]);

    await mineBlocks(ethers, 21000);

    const erc1155facet = await ethers.getContractAt(
      "ERC1155Facet",
      g.installationsAddress
    );

    const balancePre = await erc1155facet.balanceOf(testAddress, 2);
    await g.installationDiamond.claimInstallations([1, 2]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);
  });
  it("Survey Parcel", async function () {
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Equip installations", async function () {
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
      await genSignature(1, 0, 0)
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      3,
      3,
      await genSignature(2, 3, 3)
    );
    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );

    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    await mineBlocks(ethers, 60000);

    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId);
    availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );

    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      Number(ethers.utils.formatUnits(parcelCapacity[0]))
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

    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId);

    const alchemicaMinusSpillover = 0.8;
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    let totalAlchemica = await g.fud.balanceOf(testAddress);
    expect(
      Number(ethers.utils.formatUnits(totalAlchemica)) -
        Number(ethers.utils.formatUnits(preBalance))
    ).to.equal(
      alchemicaMinusSpillover *
        Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );
  });
  it("Equip level 2 and claim alchemica", async function () {
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      10,
      10,
      await genSignature(2, 10, 10)
    );
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 3,
      coordinateY: 3,
      installationId: 2,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    await g.installationDiamond.upgradeInstallation(upgradeQueue);

    await mineBlocks(ethers, 20000);

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
    let startBalance = await g.fud.balanceOf(testAddress);
    await g.installationDiamond.finalizeUpgrade();
    await mineBlocks(ethers, 60000);

    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId);
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );
    const alchemicaRemaining2 = await g.alchemicaFacet.getRealmAlchemica(
      testParcelId
    );

    let messageHash2 = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256", "uint256"],
      [0, testParcelId, testGotchiId, alchemicaRemaining2[0]]
    );
    let signedMessage2 = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash2)
    );
    let signature2 = ethers.utils.arrayify(signedMessage2);

    signedMessage = await backendSigner.signMessage(messageHash);
    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      [0],
      testGotchiId,
      signature2
    );

    let claimedAlchemica = await g.fud.balanceOf(testAddress);

    //combined spillover of reservoirs is 15%
    const alchemicaMinusSpillover = 0.85;
    expect(
      Number(ethers.utils.formatUnits(claimedAlchemica)) -
        Number(ethers.utils.formatUnits(startBalance))
    ).to.equal(
      alchemicaMinusSpillover *
        Number(ethers.utils.formatUnits(parcelCapacity[0]))
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
    const harvester = await g.installationDiamond.getInstallationType(1);
    const harvesterFudCost = harvester.alchemicaCost[0];
    const balancePre = await g.fud.balanceOf(testAddress);
    await g.realmFacet.unequipInstallation(
      testParcelId,
      1,
      0,
      0,
      await genSignature(1, 0, 0)
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
        await genSignature(2, 10, 10)
      )
    ).to.be.revertedWith(
      "LibAlchemica: Unclaimed alchemica greater than reservoir capacity"
    );
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

    await g.realmFacet.unequipInstallation(
      testParcelId,
      3,
      3,
      3,
      await genSignature(3, 3, 3)
    );
    await g.realmFacet.unequipInstallation(
      testParcelId,
      2,
      10,
      10,
      await genSignature(2, 10, 10)
    );
  });
});
