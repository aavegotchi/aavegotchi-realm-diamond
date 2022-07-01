import {
  aavegotchiDAOAddress,
  impersonate,
  impersonateSigner,
  maticAavegotchiDiamondAddress,
  mineBlocks,
  pixelcraftAddress,
} from "../../scripts/helperFunctions";
import {
  InstallationFacet,
  ERC1155Facet,
  IERC20,
  InstallationAdminFacet,
  RealmFacet,
  InstallationUpgradeFacet,
  TestInstallationFacet,
  TestRealmFacet,
  TestTileFacet,
} from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamond } from "../../scripts/installation/deploy";
import { BigNumber, BigNumberish, Signer } from "ethers";

import {
  approveAlchemica,
  approveRealAlchemica,
  faucetRealAlchemica,
  genUpgradeInstallationSignature,
} from "../../scripts/realm/realmHelpers";
import { InstallationTypeInput, UpgradeQueue } from "../../types";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-fixStartGrid";
import { upgradeInstallationTest } from "../../scripts/installation/upgrades/test/upgrade-testInstallationFacet";
import { upgradeRealmTest } from "../../scripts/realm/upgrades/test/upgrade-realmTest";
import { upgradeTileTest } from "../../scripts/tile/upgrades/test/upgrade-testTileFacet";
import { varsForNetwork } from "../../constants";
import { RealmGridFacet } from "../../typechain/RealmGridFacet";

describe("Testing Equip Installation", async function () {
  let installationFacet: InstallationFacet;
  let installationUpgradeFacet: InstallationUpgradeFacet;
  let realmFacet: RealmFacet;
  let realmGridFacet: RealmGridFacet;

  let testInstallationFacet: TestInstallationFacet;
  let testRealmFacet: TestRealmFacet;
  let testTileFacet: TestTileFacet;
  let notOwner: Signer;
  const owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const notOwnerAddress = "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B";
  const realmId = 2258;

  before(async function () {
    this.timeout(20000000);

    notOwner = await impersonateSigner(notOwnerAddress, ethers, network);

    const c = await varsForNetwork(ethers);

    console.log("c:", c);

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      c.installationDiamond
    )) as InstallationFacet;

    testInstallationFacet = (await ethers.getContractAt(
      "TestInstallationFacet",
      c.installationDiamond
    )) as TestInstallationFacet;

    installationUpgradeFacet = (await ethers.getContractAt(
      "InstallationUpgradeFacet",
      c.installationDiamond
    )) as InstallationUpgradeFacet;

    testRealmFacet = (await ethers.getContractAt(
      "TestRealmFacet",
      c.realmDiamond
    )) as TestRealmFacet;

    testTileFacet = (await ethers.getContractAt(
      "TestTileFacet",
      c.tileDiamond
    )) as TestTileFacet;

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond
    )) as RealmFacet;

    realmGridFacet = (await ethers.getContractAt(
      "RealmGridFacet",
      c.realmDiamond
    )) as RealmGridFacet;

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

    realmFacet = await impersonate(owner, realmFacet, ethers, network);
    testRealmFacet = await impersonate(owner, testRealmFacet, ethers, network);
    testTileFacet = await impersonate(owner, testTileFacet, ethers, network);

    await upgrade();
    await upgradeInstallationTest();
    await upgradeRealmTest();
    await upgradeTileTest();
  });

  it("Should update start position on installation placement", async () => {
    await testInstallationFacet.testCraftInstallations([10]);
    await testRealmFacet.testEquipInstallation(realmId, 10, 3, 3);
    expect(
      await realmGridFacet.isGridStartPosition(realmId, 3, 3, false)
    ).to.equal(true);
  });
  it("Should fail to move installations if not parcel owner", async () => {
    await expect(
      realmFacet.connect(notOwner).moveInstallation(realmId, 10, 3, 3, 4, 4)
    ).to.be.revertedWith("AppStorage: Only Parcel owner can call");
  });
  it("Should not be able to move installations if the start position is not correct", async () => {
    await expect(
      realmFacet.moveInstallation(realmId, 10, 3, 4, 4, 4)
    ).to.be.revertedWith("LibRealm: wrong startPosition");
  });
  it("Should be able to move installations", async () => {
    await realmFacet.moveInstallation(realmId, 10, 3, 3, 2, 2);

    expect(
      await realmGridFacet.isGridStartPosition(realmId, 3, 3, false)
    ).to.equal(false);
    expect(
      await realmGridFacet.isGridStartPosition(realmId, 2, 2, false)
    ).to.equal(true);
  });
  it("Should remove start position on installation removal", async () => {
    await testRealmFacet.testRemoveInstallation(realmId, 10, 2, 2);
    expect(
      await realmGridFacet.isGridStartPosition(realmId, 2, 2, false)
    ).to.equal(false);
  });
  it("Should update start position for tiles on placement", async () => {
    await testTileFacet.testCraftTiles([4]);
    await testRealmFacet.testEquipTile(realmId, 4, 3, 3);
    expect(
      await realmGridFacet.isGridStartPosition(realmId, 3, 3, true)
    ).to.equal(true);
  });
  it("Should fail to move tile if not parcel owner", async () => {
    await expect(
      realmFacet.connect(notOwner).moveTile(realmId, 4, 3, 3, 4, 4)
    ).to.be.revertedWith("AppStorage: Only Parcel owner can call");
  });
  it("Should not be able to move tile if the start position is not correct", async () => {
    await expect(
      realmFacet.moveTile(realmId, 4, 3, 4, 4, 4)
    ).to.be.revertedWith("LibRealm: wrong startPosition");
  });
  it("Should be able to move tile", async () => {
    await realmFacet.moveTile(realmId, 4, 3, 3, 2, 2);

    expect(
      await realmGridFacet.isGridStartPosition(realmId, 3, 3, true)
    ).to.equal(false);
    expect(
      await realmGridFacet.isGridStartPosition(realmId, 2, 2, true)
    ).to.equal(true);
  });
  it("Should not allow removal if the start position is not correct", async () => {
    await expect(
      testRealmFacet.testUnequipTile(realmId, 4, 4, 3)
    ).to.be.revertedWith("LibRealm: wrong startPosition");
  });
  it("Should remove start position for tiles on removal", async () => {
    await testRealmFacet.testUnequipTile(realmId, 4, 2, 2);
    expect(
      await realmGridFacet.isGridStartPosition(realmId, 2, 2, true)
    ).to.equal(false);
  });
  it("Should not be able to manually update start positions by non-owner", async () => {
    await expect(
      realmGridFacet.fixGridStartPositions([realmId], [2], [2], true, true)
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });
  it("Should be able to manually update start positions by owner", async () => {
    const realmFacetWithOwner = await impersonate(
      "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119",
      realmFacet,
      ethers,
      network
    );
    await realmFacetWithOwner.fixGridStartPositions(
      [realmId],
      [1],
      [1],
      true,
      true
    );
    expect(
      await realmGridFacet.isGridStartPosition(realmId, 1, 1, true)
    ).to.equal(true);
  });
});
