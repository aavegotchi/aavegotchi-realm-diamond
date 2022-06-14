import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  mineBlocks,
  pixelcraftAddress,
} from "../../scripts/helperFunctions";
import {
  InstallationFacet,
  ERC1155Facet,
  IERC20,
  InstallationAdminFacet,
  InstallationUpgradeFacet,
  TestInstallationFacet,
  TestRealmFacet,
} from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamond } from "../../scripts/installation/deploy";
import { BigNumber, BigNumberish, Signer } from "ethers";
import {
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
} from "../../constants";
import {
  approveAlchemica,
  approveRealAlchemica,
  faucetRealAlchemica,
  genUpgradeInstallationSignature,
} from "../../scripts/realm/realmHelpers";
import { InstallationTypeInput, UpgradeQueue } from "../../types";
import { upgrade } from "../../scripts/installation/upgrades/upgrade-parcelUpgradeTracking";
import { upgradeTest } from "../../scripts/installation/upgrades/test/upgrade-testInstallationFacet";
import { upgradeRealmTest } from "../../scripts/realm/upgrades/test/upgrade-realmTest";
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-realm";

describe("Testing Equip Installation", async function () {
  let installationFacet: InstallationFacet;
  let testInstallationFacet: TestInstallationFacet;
  let installationUpgradeFacet: InstallationUpgradeFacet;
  let testRealmFacet: TestRealmFacet;
  const owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const realmId = 2258;
  let upgradeId;
  before(async function () {
    this.timeout(20000000);

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      maticInstallationDiamondAddress
    )) as InstallationFacet;

    testInstallationFacet = (await ethers.getContractAt(
      "TestInstallationFacet",
      maticInstallationDiamondAddress
    )) as TestInstallationFacet;

    installationUpgradeFacet = (await ethers.getContractAt(
      "InstallationUpgradeFacet",
      maticInstallationDiamondAddress
    )) as InstallationUpgradeFacet;

    testRealmFacet = (await ethers.getContractAt(
      "TestRealmFacet",
      maticRealmDiamondAddress
    )) as TestRealmFacet;

    installationFacet = await impersonate(
      owner,
      installationFacet,
      ethers,
      network
    );
    testInstallationFacet = await impersonate(
      owner,
      testInstallationFacet,
      ethers,
      network
    );
    installationUpgradeFacet = await impersonate(
      owner,
      installationUpgradeFacet,
      ethers,
      network
    );
    testRealmFacet = await impersonate(owner, testRealmFacet, ethers, network);

    await upgrade();
    await upgradeTest();
    await upgradeRealmTest();
  });

  it("Should initiate an upgrade for an installation and the getter for parcel upgrades should work", async () => {
    await testInstallationFacet.testCraftInstallations([10]);
    await testRealmFacet.testEquipInstallation(realmId, 10, 0, 0);
    await testInstallationFacet.testUpgradeInstallation(
      {
        owner: owner,
        coordinateX: 0,
        coordinateY: 0,
        readyBlock: 0,
        claimed: false,
        parcelId: realmId,
        installationId: 10,
      },
      0
    );
    const upgradeQueueLength =
      await installationUpgradeFacet.getUpgradeQueueLength();
    console.log(upgradeQueueLength);
    upgradeId = await installationUpgradeFacet.getParcelUpgradeQueue(realmId);
    expect(upgradeId).to.equal([upgradeQueueLength.sub(1)]);
    console.log("Complete user upgrade queue from new implementation:");
    console.log(await installationUpgradeFacet.getUserUpgradeQueueNew(owner));
  });
  it("Should finalize an upgrade and the getter should remove the upgrade id", async () => {
    await mineBlocks(ethers, 65000);
    const tx = await installationUpgradeFacet.finalizeUpgrades(upgradeId);
    expect(
      await installationUpgradeFacet.getParcelUpgradeQueue(realmId)
    ).to.equal([]);
  });
});
