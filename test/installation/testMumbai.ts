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
  beforeTest,
  testInstallations,
  genChannelAlchemicaSignature,
  genUpgradeInstallationSignature,
  mintAlchemica,
  approveAlchemica,
} from "../../scripts/realm/realmHelpers";
import {
  AlchemicaFacet,
  InstallationAdminFacet,
  InstallationFacet,
  RealmFacet,
} from "../../typechain";

describe("Testing Equip Installation", async function () {
  const testAddress = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const testParcelId = 1;

  const diamondAddress = "0x1cefe47444e5597368fF81D083dCDd8C4FECeBdE";
  const installationDiamond = "0x7bC1d8C927a61c43c359E350333Ac5343a3Ef0F5";
  const owner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  let realmFacet: RealmFacet;
  let alchemicaFacet: AlchemicaFacet;
  let installationFacet: InstallationFacet;
  let installationAdminFacet: InstallationAdminFacet;

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
  });
  it("Craft installations", async function () {
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );

    await installationFacet.craftInstallations([1]);
  });
  it("Equip altar", async function () {
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    await realmFacet.equipInstallation(0, 1, 0, 0, await genSignature(1, 0, 0));
  });
  xit("Survey Parcel", async function () {
    await alchemicaFacet.testingStartSurveying(0);
  });
});
