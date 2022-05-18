import {
  impersonate,
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
  beforeTest,
  testInstallations,
  genChannelAlchemicaSignature,
  genUpgradeInstallationSignature,
  mintAlchemica,
  approveAlchemica,
  faucetRealAlchemica,
  approveRealAlchemica,
} from "../../scripts/realm/realmHelpers";
import {
  AlchemicaFacet,
  InstallationAdminFacet,
  InstallationFacet,
  RealmFacet,
  TileFacet,
  ERC721Facet,
} from "../../typechain";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-batchGetGrid";
import { upgrade as upgrade2 } from "../../scripts/realm/upgrades/upgrade-testMumbai";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 1;

  const diamondAddress = "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";
  const installationDiamond = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";
  const tileDiamond = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";
  const owner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  let realmFacet: RealmFacet;
  let alchemicaFacet: AlchemicaFacet;
  let installationFacet: InstallationFacet;
  let installationAdminFacet: InstallationAdminFacet;
  let tileFacet: TileFacet;
  let erc721Facet: ERC721Facet;

  const genSignature = async (tileId: number, x: number, y: number) => {
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    let messageHash1 = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256", "uint256"],
      [0, tileId, x, y]
    );
    let signedMessage1 = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash1)
    );
    let signature1 = ethers.utils.arrayify(signedMessage1);

    return signature1;
  };

  before(async function () {
    this.timeout(20000000);

    await upgrade2();

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      diamondAddress
    )) as RealmFacet;

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      diamondAddress
    )) as AlchemicaFacet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      installationDiamond
    )) as InstallationFacet;

    installationAdminFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      installationDiamond
    )) as InstallationAdminFacet;
    tileFacet = (await ethers.getContractAt(
      "TileFacet",
      tileDiamond
    )) as TileFacet;
    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      diamondAddress
    )) as ERC721Facet;
  });

  // const listPre = await installationFacet.getUserUpgradeQueue(owner);
  // console.log(listPre);
  // await mineBlocks(ethers, 50);
  // await installationAdminFacet.finalizeUpgrade();
  // const listPost = await installationFacet.getUserUpgradeQueue(owner);
  // console.log(listPost);
  // it("finalize upgrade", async function () {
  //   await installationAdminFacet.finalizeUpgrade();

  //   const queue = await installationFacet.getAllUpgradeQueue();

  //   console.log(queue);
  // });
  it("test upgrade", async function () {
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    const upgradeQueue1: UpgradeQueue = {
      parcelId: 5933,
      coordinateX: 7,
      coordinateY: 7,
      installationId: 10,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    const signatureAlt1 = await genUpgradeInstallationSignature(5933, 7, 7, 10);
    await installationFacet.upgradeInstallation(
      upgradeQueue1,
      signatureAlt1,
      0
    );
    console.log("upgraded?");
    // const userQueue = await installationFacet.getUserUpgradeQueue(
    //   "0x1091232c61EeE86418DC93a5c895db3490386501"
    // );
    // console.log("queue", userQueue);
    // installationFacet = await impersonate(
    //   owner,
    //   installationFacet,
    //   ethers,
    //   network
    // );
    // await installationAdminFacet.clean();
    // const all = await installationFacet.getAllUpgradeQueue();
    // console.log(all);
    // const upgradeQueue1: UpgradeQueue = {
    //   parcelId: 8,
    //   coordinateX: 0,
    //   coordinateY: 0,
    //   installationId: 10,
    //   readyBlock: 0,
    //   claimed: false,
    //   owner: owner,
    // };
    // const signatureAlt1 = await genUpgradeInstallationSignature(8, 0, 0, 10);
    // await installationFacet.upgradeInstallation(upgradeQueue1, signatureAlt1);
    // const listPre = await installationFacet.getUserUpgradeQueue(owner);
    // console.log(listPre);
    // await mineBlocks(ethers, 50);
    // await installationAdminFacet.finalizeUpgrade();
    // const listPost = await installationFacet.getUserUpgradeQueue(owner);
    // console.log(listPost);
    // const upgradeQueue2: UpgradeQueue = {
    //   parcelId: 8,
    //   coordinateX: 0,
    //   coordinateY: 0,
    //   installationId: 11,
    //   readyBlock: 0,
    //   claimed: false,
    //   owner: owner,
    // };
    // const signatureAlt2 = await genUpgradeInstallationSignature(8, 0, 0, 11);
    // await installationFacet.upgradeInstallation(upgradeQueue2, signatureAlt2);
    // await mineBlocks(ethers, 50);
    // await installationAdminFacet.finalizeUpgrade();
  });
});
