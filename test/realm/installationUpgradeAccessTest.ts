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
  RealmGridFacet,
  InstallationFacet,
  InstallationUpgradeFacet,
  AlchemicaFacet,
  TestInstallationFacet,
  TestRealmFacet,
  OwnershipFacet,
} from "../../typechain";
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-checkStartCoordinate";
import { upgradeRealmTest } from "../../scripts/realm/upgrades/test/upgrade-realmTest";
import { upgradeInstallation } from "../../scripts/installation/upgrades/upgrade-accessRightsUpgrade";
import { upgradeInstallationTest } from "../../scripts/installation/upgrades/test/upgrade-testInstallationFacet";
import { alchemica, varsForNetwork } from "../../constants";
import { Signer, BigNumber, BigNumberish } from "ethers";

describe("Installation Upgrade Access Rights test", async function () {
  let parcelId = 15882;
  let gotchiId = 21655;
  let borrowedGotchiId = 11939;
  let owner = "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B";
  let borrower = "0xd82974D2E506388e1d82Ab9d77A7337F4A470284";
  let realmOwner: string;
  let installationOwner: string;
  let altarPosition = [14, 0];

  let impersonatedSigner: Signer;
  let impersonatedBorrower: Signer;
  let impersonatedRealmOwner: Signer;
  let impersonatedInstallationOwner: Signer;

  let c;

  let realmFacet: RealmFacet;
  let realmGridFacet: RealmGridFacet;
  let realmGettersAndSettersFacet: RealmGettersAndSettersFacet;
  let alchemicaFacet: AlchemicaFacet;
  let testRealmFacet: TestRealmFacet;
  let installationUpgradeFacet: InstallationUpgradeFacet;
  let installationFacet: InstallationFacet;
  let testInstallationFacet: TestInstallationFacet;
  let ownershipFacetRealm: OwnershipFacet;
  let ownershipFacetInstallation: OwnershipFacet;

  before(async function () {
    this.timeout(20000000);
    c = await varsForNetwork(ethers);

    ownershipFacetRealm = await ethers.getContractAt(
      "OwnershipFacet",
      c.realmDiamond
    );
    ownershipFacetInstallation = await ethers.getContractAt(
      "OwnershipFacet",
      c.installationDiamond
    );
    realmOwner = await ownershipFacetRealm.owner();
    installationOwner = await ownershipFacetInstallation.owner();

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });

    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [realmOwner],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [installationOwner],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [borrower],
    });

    impersonatedSigner = await ethers.getSigner(owner);
    impersonatedBorrower = await ethers.getSigner(borrower);
    impersonatedRealmOwner = await ethers.getSigner(realmOwner);
    impersonatedInstallationOwner = await ethers.getSigner(installationOwner);

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond,
      impersonatedSigner
    )) as RealmFacet;

    realmGridFacet = (await ethers.getContractAt(
      "RealmGridFacet",
      c.realmDiamond,
      impersonatedSigner
    )) as RealmGridFacet;

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

    await realmGridFacet
      .connect(impersonatedRealmOwner)
      .fixGridStartPositions(
        [parcelId],
        [altarPosition[0]],
        [altarPosition[1]],
        false,
        [10]
      );

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
      gotchiId,
      1_000_000_000_000
    );
  });

  describe("Installation Test", async () => {
    it("Should upgrade an installation instantly with GLTR", async () => {
      await testInstallationFacet.mockUpgradeInstallation(
        {
          owner: owner,
          coordinateX: altarPosition[0],
          coordinateY: altarPosition[1],
          readyBlock: 0,
          claimed: false,
          parcelId: parcelId,
          installationId: 11,
        },
        gotchiId,
        1_000_000_000_000
      );
      await realmGettersAndSettersFacet.checkCoordinates(
        parcelId,
        altarPosition[0],
        altarPosition[1],
        12
      );
    });
    it("Should add an installation to upgrade queue", async () => {
      await testInstallationFacet.mockUpgradeInstallation(
        {
          owner: owner,
          coordinateX: altarPosition[0],
          coordinateY: altarPosition[1],
          readyBlock: 0,
          claimed: false,
          parcelId: parcelId,
          installationId: 12,
        },
        gotchiId,
        0
      );
      expect(
        (await installationUpgradeFacet.getParcelUpgradeQueue(parcelId))
          .indexes_.length
      ).to.equal(1);
    });
    it("Should be able to finalize an installation upgrade", async () => {
      let upgradeId = (
        await installationUpgradeFacet.getParcelUpgradeQueue(parcelId)
      ).indexes_[0];
      await mineBlocks(ethers, 320000);
      await installationUpgradeFacet.finalizeUpgrades([upgradeId]);
      await realmGettersAndSettersFacet.checkCoordinates(
        parcelId,
        altarPosition[0],
        altarPosition[1],
        13
      );
    });
    it("Should revert if the start position is wrong", async () => {
      await expect(
        testInstallationFacet.mockUpgradeInstallation(
          {
            owner: owner,
            coordinateX: altarPosition[0] + 1,
            coordinateY: altarPosition[1],
            readyBlock: 0,
            claimed: false,
            parcelId: parcelId,
            installationId: 13,
          },
          gotchiId,
          0
        )
      ).to.be.revertedWith("RealmGettersAndSettersFacet: wrong coordinates");
    });
    it("Non-owner should not be able to upgrade with access right 0", async () => {
      await expect(
        testInstallationFacet
          .connect(impersonatedBorrower)
          .mockUpgradeInstallation(
            {
              owner: owner,
              coordinateX: altarPosition[0],
              coordinateY: altarPosition[1],
              readyBlock: 0,
              claimed: false,
              parcelId: parcelId,
              installationId: 13,
            },
            gotchiId,
            1e9
          )
      ).to.be.revertedWith("LibRealm: Access Right - Only Owner");
    });
    it("Should allow borrowed gotchis to upgrade if access right is 1", async () => {
      await realmGettersAndSettersFacet.setParcelsAccessRights(
        [parcelId],
        [6],
        [1]
      );
      await testInstallationFacet.mockUpgradeInstallation(
        {
          owner: owner,
          coordinateX: altarPosition[0],
          coordinateY: altarPosition[1],
          readyBlock: 0,
          claimed: false,
          parcelId: parcelId,
          installationId: 13,
        },
        gotchiId,
        1e9
      );
      await realmGettersAndSettersFacet.checkCoordinates(
        parcelId,
        altarPosition[0],
        altarPosition[1],
        14
      );
    });
    it("Should not be able to queue the same upgrade twice", async () => {
      await testInstallationFacet.mockUpgradeInstallation(
        {
          owner: owner,
          coordinateX: altarPosition[0],
          coordinateY: altarPosition[1],
          readyBlock: 0,
          claimed: false,
          parcelId: parcelId,
          installationId: 14,
        },
        gotchiId,
        0
      );
      await expect(
        testInstallationFacet.mockUpgradeInstallation(
          {
            owner: owner,
            coordinateX: altarPosition[0],
            coordinateY: altarPosition[1],
            readyBlock: 0,
            claimed: false,
            parcelId: parcelId,
            installationId: 14,
          },
          gotchiId,
          0
        )
      ).to.be.revertedWith("InstallationUpgradeFacet: Upgrade hash not unique");
    });
  });
});
