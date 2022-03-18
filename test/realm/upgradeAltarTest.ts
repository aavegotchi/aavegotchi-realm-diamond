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
  faucetAlchemica,
  genEquipInstallationSignature,
  testInstallations,
  testnetAltar,
} from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress(network.name));
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

    await g.installationAdminFacet.addInstallationTypes(testnetAltar());
    installationsTypes = await g.installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(testnetAltar().length);
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
      g.installationDiamond.craftInstallations([1])
    ).to.be.revertedWith("ERC20: insufficient allowance");

    await faucetAlchemica(g.alchemicaFacet, "20000");

    await approveAlchemica(g, ethers, testAddress, network);

    let fudPreCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraft = await g.kek.balanceOf(maticDiamondAddress);

    //Craft an Altar
    await g.installationDiamond.craftInstallations([1]);
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

    await mineBlocks(ethers, 21000);

    await g.installationDiamond.claimInstallations([0]);
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
      await genEquipInstallationSignature(1, 0, 0, testParcelId)
    );
  });
  it("Test upgrade queue", async function () {
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      installationId: 1,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    // const upgradeQueue2: UpgradeQueue = {
    //   parcelId: testParcelId,
    //   coordinateX: 3,
    //   coordinateY: 3,
    //   installationId: 2,
    //   readyBlock: 0,
    //   claimed: false,
    //   owner: testAddress,
    // };
    await g.installationDiamond.upgradeInstallation(upgradeQueue);
    // await expect(
    //   g.installationDiamond.upgradeInstallation(upgradeQueue)
    // ).to.be.revertedWith("InstallationFacet: UpgradeQueue full");
    // await expect(
    //   g.installationDiamond.upgradeInstallation(upgradeQueue2)
    // ).to.be.revertedWith("InstallationFacet: UpgradeQueue full");
    // await g.realmFacet.equipInstallation(
    //   testParcelId,
    //   6,
    //   6,
    //   6,
    //   await genEquipInstallationSignature(6, 6, 6, testParcelId)
    // );
    // await g.installationDiamond.upgradeInstallation(upgradeQueue2);
  });
});
