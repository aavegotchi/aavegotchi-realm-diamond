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
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
  maticTileDiamondAddress,
} from "../../constants";
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

describe("Testing Equip Installation", async function () {
  let installationFacet: InstallationFacet;
  let installationUpgradeFacet: InstallationUpgradeFacet;
  let realmFacet: RealmFacet;

  let testInstallationFacet: TestInstallationFacet;
  let testRealmFacet: TestRealmFacet;
  let testTileFacet: TestTileFacet;
  const owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const realmId = 2258;

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

    testTileFacet = (await ethers.getContractAt(
      "TestTileFacet",
      maticTileDiamondAddress
    )) as TestTileFacet;

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticRealmDiamondAddress
    )) as RealmFacet;

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
    await testInstallationFacet.testCraftInstallations([19]);
    await testRealmFacet.testEquipInstallation(realmId, 19, 3, 3);
    expect(await realmFacet.isGridStartPosition(realmId, 3, 3, false)).to.equal(
      true
    );
  });
  it("Should remove start position on installation removal", async () => {
    await testRealmFacet.testRemoveInstallation(realmId, 19, 3, 3);
    expect(await realmFacet.isGridStartPosition(realmId, 3, 3, false)).to.equal(
      false
    );
  });
  it("Should update start position for tiles on placement", async () => {
    await testTileFacet.testCraftTiles([4]);
    await testRealmFacet.testEquipTile(realmId, 4, 3, 3);
    expect(await realmFacet.isGridStartPosition(realmId, 3, 3, true)).to.equal(
      true
    );
  });
  it("Should not allow removal if the start position is not correct", async () => {
    await expect(
      testRealmFacet.testUnequipTile(realmId, 4, 4, 3)
    ).to.be.revertedWith("LibRealm: wrong startPosition");
  });
  it("Should remove start position for tiles on removal", async () => {
    await testRealmFacet.testUnequipTile(realmId, 4, 3, 3);
    expect(await realmFacet.isGridStartPosition(realmId, 3, 3, true)).to.equal(
      false
    );
  });
  it("Should not be able to manually update start positions by non-owner", async () => {
    await expect(
      realmFacet.fixGridStartPositions([realmId], [2], [2], true, true)
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
    expect(await realmFacet.isGridStartPosition(realmId, 1, 1, true)).to.equal(
      true
    );
  });
});
