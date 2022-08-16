import { impersonate, mineBlocks } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { TestBeforeVars, UpgradeQueue } from "../../types";

import {
  approveAlchemica,
  mintAlchemica,
  genEquipInstallationSignature,
  genUpgradeInstallationSignature,
  genReduceUpgradeTimeSignature,
} from "../../scripts/realm/realmHelpers";
import {
  InstallationUpgradeFacet,
  RealmFacet,
  RealmGridFacet,
} from "../../typechain";
import { varsForNetwork } from "../../constants";
import { upgradePreventMoving } from "../../scripts/installation/upgrades/upgrade-preventMoving";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const testParcelId = 22518;

  let installationUpgradeFacet: InstallationUpgradeFacet;
  let realmFacet: RealmFacet;
  let realmGridFacet: RealmGridFacet;

  before(async function () {
    this.timeout(20000000);

    const c = await varsForNetwork(ethers);

    await upgradePreventMoving();

    installationUpgradeFacet = await ethers.getContractAt(
      "InstallationUpgradeFacet",
      c.installationDiamond
    );

    realmFacet = await ethers.getContractAt("RealmFacet", c.realmDiamond);

    installationUpgradeFacet = await impersonate(
      testAddress,
      installationUpgradeFacet,
      ethers,
      network
    );

    realmGridFacet = await ethers.getContractAt(
      "RealmGridFacet",
      c.realmDiamond
    );

    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
  });

  it("Installation cannot be moved while upgrading", async function () {
    const coordinateX = 2;
    const coordinateY = 4;
    const installationId = 10;
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: coordinateX,
      coordinateY: coordinateY,
      installationId: installationId,
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

    await installationUpgradeFacet.upgradeInstallation(
      upgradeQueue,
      signature,
      0
    );

    await expect(
      realmFacet.moveInstallation(
        testParcelId,
        installationId,
        coordinateX,
        coordinateY,
        coordinateX + 1,
        coordinateY + 1
      )
    ).to.be.revertedWith("RealmFacet: Installation is upgrading");

    const openUpgrades = await installationUpgradeFacet.getParcelUpgradeQueue(
      testParcelId
    );

    const queueIndex = openUpgrades.indexes_[0];

    const reduceUpgradeSig = await genReduceUpgradeTimeSignature(
      queueIndex.toNumber()
    );

    await installationUpgradeFacet.reduceUpgradeTime(
      queueIndex,
      65000,
      reduceUpgradeSig
    );

    await realmFacet.moveInstallation(
      testParcelId,
      installationId + 1, //now lvl 2
      coordinateX,
      coordinateY,
      coordinateX + 1,
      coordinateY + 1
    );

    const grid = await realmGridFacet.getReasonableGrid(testParcelId, 0);

    console.log("grid:", grid);

    await mineBlocks(ethers, 20000);
  });
});
