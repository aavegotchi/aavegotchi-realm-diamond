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
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-checkStartCoordinate";
import { upgradeRealmTest } from "../../scripts/realm/upgrades/test/upgrade-realmTest";
import { upgradeInstallation } from "../../scripts/installation/upgrades/upgrade-accessRightsUpgrade";
import { upgradeInstallationTest } from "../../scripts/installation/upgrades/test/upgrade-testInstallationFacet";
import { alchemica, varsForNetwork } from "../../constants";
import { Signer } from "ethers";

describe("Installation Upgrade Access Rights test", async function () {
  let parcelId = 11095;
  let owner = "0x38A1E0Bf2745740C303FE4140397D157818A6e3C";
  let altarPosition = [15, 0];

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

    await upgradeRealm();
    await upgradeRealmTest();
    await upgradeInstallation();
    await upgradeInstallationTest();

    await testInstallationFacet.mockCraftInstallation(10);
    await testRealmFacet.mockEquipInstallation(
      parcelId,
      10,
      altarPosition[0],
      altarPosition[1]
    );
  });

  describe("Installation Test", async () => {
    it("Should make me rich", async () => {});
  });
});
