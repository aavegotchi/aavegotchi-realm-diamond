import { impersonate, mineBlocks } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { UpgradeQueue } from "../../types";
import { alchemicaTotals } from "../../scripts/setVars";
import {
  genClaimAlchemicaSignature,
  genEquipInstallationSignature,
  genChannelAlchemicaSignature,
} from "../../scripts/realm/realmHelpers";
import {
  RealmFacet,
  RealmGettersAndSettersFacet,
  InstallationFacet,
  InstallationUpgradeFacet,
  AlchemicaFacet,
  TestInstallationFacet,
  TestRealmFacet,
} from "../../typechain";
import { harvesterUpgrade } from "../../scripts/realm/upgrades/upgrade-haarvesterReleaseFinal";
import { upgradeRealmTest } from "../../scripts/realm/upgrades/test/upgrade-realmTest";
import { upgradeInstallationTest } from "../../scripts/installation/upgrades/test/upgrade-testInstallationFacet";
import { alchemica, varsForNetwork } from "../../constants";
import { Signer } from "ethers";

describe("Access rights test", async function () {
  let parcelId = 141;
  let owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let altarPosition = [7, 7];

  let impersonatedSigner: Signer;

  let c;

  let realmFacet: RealmFacet;
  let realmGettersAndSettersFacet: RealmGettersAndSettersFacet;
  let alchemicaFacet: AlchemicaFacet;
  let testRealmFacet: TestRealmFacet;
  let installationUpgradeFacet: InstallationUpgradeFacet;
  let installationFacet: InstallationFacet;
  let testInstallationFacet: TestInstallationFacet;

  before(async function () {
    this.timeout(20000000);

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    impersonatedSigner = await ethers.getSigner(owner);

    c = await varsForNetwork(ethers);

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond,
      impersonatedSigner
    )) as RealmFacet;

    realmGettersAndSettersFacet = (await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      c.realmDiamond,
      impersonatedSigner
    )) as RealmGettersAndSettersFacet;

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      c.realmDiamond,
      impersonatedSigner
    )) as AlchemicaFacet;

    testRealmFacet = (await ethers.getContractAt(
      "TestRealmFacet",
      c.realmDiamond,
      impersonatedSigner
    )) as TestRealmFacet;

    installationUpgradeFacet = (await ethers.getContractAt(
      "InstallationUpgradeFacet",
      c.installationDiamond,
      impersonatedSigner
    )) as InstallationUpgradeFacet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      c.installationDiamond,
      impersonatedSigner
    )) as InstallationFacet;

    testInstallationFacet = (await ethers.getContractAt(
      "TestInstallationFacet",
      c.installationDiamond,
      impersonatedSigner
    )) as TestInstallationFacet;

    await harvesterUpgrade();
    await upgradeRealmTest();
    await upgradeInstallationTest();
  });

  describe("Installation in upgrade queue", async () => {
    it("Should not let a user unequip an installation if it is in queue", async () => {
      await testInstallationFacet.mockUpgradeInstallation(
        {
          owner: owner,
          coordinateX: altarPosition[0],
          coordinateY: altarPosition[1],
          readyBlock: 0,
          claimed: false,
          parcelId: parcelId,
          installationId: 10,
        },
        0
      );

      await expect(
        testRealmFacet.mockUnequipInstallation(
          parcelId,
          10,
          altarPosition[0],
          altarPosition[1]
        )
      ).to.be.revertedWith(
        "RealmFacet: Can't unequip installation in upgrade queue"
      );
    });
  });
});
