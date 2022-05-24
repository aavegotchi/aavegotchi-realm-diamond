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
} from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamond } from "../../scripts/installation/deploy";
import { BigNumber, BigNumberish, Signer } from "ethers";
import {
  maticGhstAddress,
  maticRealmDiamondAddress,
} from "../../scripts/installation/helperFunctions";
import {
  approveAlchemica,
  approveRealAlchemica,
  faucetRealAlchemica,
  genEquipInstallationSignature,
  genUpgradeInstallationSignature,
  outputInstallation,
} from "../../scripts/realm/realmHelpers";
import { InstallationTypeInput, UpgradeQueue } from "../../types";
import { maticInstallationDiamondAddress } from "../../constants";
import { upgradeUserQueue } from "../../scripts/installation/upgrades/upgrade-userUpgradeQueue";

describe("Installations tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const testAddress2 = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let diamondAddress: string;
  let realmFacet: RealmFacet;
  let installationFacet: InstallationFacet;
  let installationAdminFacet: InstallationAdminFacet;
  let erc1155Facet: ERC1155Facet;
  let ghst: IERC20;
  let accounts: Signer[];
  const testParcelId = "12184";

  before(async function () {
    this.timeout(20000000);
    diamondAddress = maticInstallationDiamondAddress;
    accounts = await ethers.getSigners();

    await upgradeUserQueue();

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      diamondAddress
    )) as InstallationFacet;

    installationAdminFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      diamondAddress
    )) as InstallationAdminFacet;

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155Facet",
      diamondAddress
    )) as ERC1155Facet;

    console.log("diamond address:", diamondAddress);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;

    realmFacet = await ethers.getContractAt(
      "RealmFacet",
      maticRealmDiamondAddress
    );
  });

  it("Upgrade installation", async function () {
    const installation = outputInstallation({
      id: 11,
      installationType: 0,
      level: 2,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 1800,
      spillRate: 45,
      upgradeQueueBoost: 1,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 12,
      prerequisites: [1, 0],
      name: "Alchemical Aaltar Level 2",
    });

    installationAdminFacet = await impersonate(
      "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119",
      installationAdminFacet,
      ethers,
      network
    );

    await installationAdminFacet.editInstallationTypes([11], [installation]);

    const parcelOwner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
    installationFacet = await impersonate(
      parcelOwner,
      installationFacet,
      ethers,
      network
    );

    realmFacet = await impersonate(parcelOwner, realmFacet, ethers, network);

    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      installationId: 10,
      readyBlock: 0,
      claimed: false,
      owner: parcelOwner,
    };

    await installationFacet.craftInstallations([10], [0]);

    const equipSignature = await genEquipInstallationSignature(
      Number(testParcelId),
      10,
      0,
      0
    );

    await realmFacet.equipInstallation(testParcelId, 10, 0, 0, equipSignature);

    const signature = await genUpgradeInstallationSignature(
      Number(testParcelId),
      0,
      0,
      10
    );

    installationAdminFacet = await impersonate(
      parcelOwner,
      installationAdminFacet,
      ethers,
      network
    );

    await installationAdminFacet.upgradeInstallation(
      upgradeQueue,
      signature,
      0
    );
  });

  it("Finalize upgrade", async function () {
    const parcelOwner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
    let upgradeQueue = await installationFacet.getUserUpgradeQueue(parcelOwner);
    expect(upgradeQueue.length).to.equal(1);

    //Complete upgrade
    await mineBlocks(ethers, 10001);

    await installationAdminFacet.finalizeUserUpgrades(parcelOwner);

    upgradeQueue = await installationFacet.getUserUpgradeQueue(parcelOwner);
    expect(upgradeQueue.length).to.equal(0);

    const balances = await installationFacet.installationBalancesOfToken(
      maticRealmDiamondAddress,
      testParcelId
    );
    expect(balances.length).to.above(0);
    expect(balances[0].installationId).to.equal(11); //lvl 2 altar
    expect(balances[0].balance).to.equal(1);
  });
});
