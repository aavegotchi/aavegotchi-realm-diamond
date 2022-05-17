//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import {
  AlchemicaFacet,
  AlchemicaToken,
  InstallationAdminFacet,
  InstallationFacet,
} from "../../../typechain";
import {
  gasPrice,
  maticAavegotchiDiamondAddress,
  realmDiamondAddress,
} from "../../helperFunctions";
import { deployAlchemica, goldenAaltar } from "../realmHelpers";
import { alchemicaTotals, boostMultipliers } from "../../setVars";
import { deployDiamond } from "../../installation/deploy";
import { deployDiamondTile } from "../../tile/deploy";
import { upgradeRealm } from "../upgrades/upgrade-realm";

export async function deployMatic() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  console.log("nonce:", await deployer.getTransactionCount());

  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);

  console.log("Deploying Installation Diamond");
  const installationDiamond = await deployDiamond();

  const tileDiamond = await deployDiamondTile();

  const realmDiamond = realmDiamondAddress("matic");

  console.log("Deploying Alchemicas");
  const alchemica = await deployAlchemica(ethers, realmDiamond);

  console.log("alchemicas:", alchemica);

  // const greatPortalCapacity: [
  //   BigNumberish,
  //   BigNumberish,
  //   BigNumberish,
  //   BigNumberish
  // ] = [
  //   ethers.utils.parseUnits("1250000000"),
  //   ethers.utils.parseUnits("625000000"),
  //   ethers.utils.parseUnits("312500000"),
  //   ethers.utils.parseUnits("125000000"),
  // ];

  // const alchemicaFacet = (await ethers.getContractAt(
  //   "AlchemicaFacet",
  //   realmDiamond
  // )) as AlchemicaFacet;

  //@todo: add correct VRF addresses

  //Matic-specific

  console.log("Upgrading Realm");
  await upgradeRealm(
    installationDiamond,
    tileDiamond,
    alchemica,
    deployerAddress
  );

  const pixelcraft = deployerAddress;
  const dao = deployerAddress;

  let tx;

  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

  console.log("Setting Installation addresses");
  const adminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    installationDiamond
  )) as InstallationAdminFacet;
  console.log("Setting addresses");
  tx = await adminFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    realmDiamond,
    alchemica.gltr.address,
    pixelcraft,
    dao,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
  );
  await tx.wait();

  console.log("InstallationDiamond deployed:", installationDiamond);
  console.log("FUD deployed:", alchemica.fud.address);
  console.log("FOMO deployed:", alchemica.fomo.address);
  console.log("ALPHA deployed:", alchemica.alpha.address);
  console.log("KEK deployed:", alchemica.kek.address);
  console.log("GLTR deployed:", alchemica.gltr.address);
  console.log("Tile Diamond deployed:", tileDiamond);

  const fudToken = (await ethers.getContractAt(
    "AlchemicaToken",
    alchemica.fud.address
  )) as AlchemicaToken;
  const owner = await fudToken.owner();
  console.log("owner:", owner);

  const signers = await ethers.getSigners();

  const installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    installationDiamond,
    signers[0]
  )) as InstallationAdminFacet;

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    installationDiamond,
    signers[0]
  )) as InstallationFacet;

  console.log("Adding Golden Altar");
  const addTx = await installationAdminFacet.addInstallationTypes(
    goldenAaltar(),
    {
      gasPrice: gasPrice,
    }
  );
  await addTx.wait();

  const installations = await installationFacet.getInstallationTypes([]);
  console.log("installations:", installations);

  return realmDiamond;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployMatic()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
