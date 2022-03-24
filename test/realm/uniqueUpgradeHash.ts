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
  testInstallations,
  genEquipInstallationSignature,
  genUpgradeInstallationSignature,
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
      g.installationDiamond.craftInstallations([2, 2, 2, 6])
    ).to.be.revertedWith("ERC20: insufficient allowance");

    await faucetAlchemica(g.alchemicaFacet, "50000");
    g.fud.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));

    approveAlchemica(g, ethers, testAddress, network);

    let fudPreCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraft = await g.kek.balanceOf(maticDiamondAddress);
    await g.installationDiamond.craftInstallations([2, 2, 2, 6]);
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

    await mineBlocks(ethers, 21000);

    await g.installationDiamond.claimInstallations([1, 2, 3]);
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
      2,
      0,
      0,
      await genEquipInstallationSignature(2, 0, 0, testParcelId)
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      6,
      3,
      3,
      await genEquipInstallationSignature(6, 3, 3, testParcelId)
    );
  });
  it("Test upgrade unique", async function () {
    const coordinateX = 0;
    const coordinateY = 0;
    const installationId = 2;
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      installationId: 2,
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
    await expect(
      g.installationDiamond.upgradeInstallation(upgradeQueue, signature)
    ).to.be.revertedWith("InstallationFacet: Upgrade hash not unique");
    await mineBlocks(ethers, 20000);

    await g.installationDiamond.finalizeUpgrade();
  });
});
