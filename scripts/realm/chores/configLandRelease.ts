import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import {
  RealmFacet,
  AlchemicaFacet,
  InstallationAdminFacet,
  TileFacet,
} from "../../../typechain";
import {
  aavegotchiDAOAddress,
  maticAavegotchiDiamondAddress,
  pixelcraftAddress,
  gasPrice,
} from "../../helperFunctions";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../setVars";
import {
  alchemica,
  maticRealmDiamondAddress,
  maticInstallationDiamondAddress,
  maticTileDiamondAddress,
} from "../../../constants";

export async function setAddresses() {
  const gltr = "";
  const polygonVrfCoordinator = "0xAE975071Be8F8eE67addBC1A82488F1C24858067";
  const polygonLink = "0xb0897686c545045aFc77CF20eC7A532E3120E0F1";

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticRealmDiamondAddress
  )) as RealmFacet;

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    maticRealmDiamondAddress
  )) as AlchemicaFacet;

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress
  )) as InstallationAdminFacet;

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    maticTileDiamondAddress
  )) as TileFacet;

  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.PROD_PK);

  console.log("set realm diamond vars");
  const setRealmVarsTx = await alchemicaFacet.setVars(
    //@ts-ignore
    alchemicaTotals(),
    boostMultipliers,
    greatPortalCapacity,
    maticInstallationDiamondAddress,
    polygonVrfCoordinator,
    polygonLink,
    alchemica,
    gltr,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
    ethers.constants.AddressZero, // gameManager
    maticTileDiamondAddress,
    maticAavegotchiDiamondAddress
  );
  await setRealmVarsTx.wait();

  console.log("set game active");
  const setGameTx = await realmFacet.setGameActive(true);

  await setGameTx.wait();

  console.log("set channelingLimits");
  const setChannelingLimitsTx = await alchemicaFacet.setChannelingLimits(
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [
      24 * 3600,
      18 * 3600,
      12 * 3600,
      8 * 3600,
      6 * 3600,
      4 * 3600,
      3 * 3600,
      2 * 3600,
      3600,
    ]
  );
  await setChannelingLimitsTx.wait();

  console.log("set installationDiamond addresses");
  const setInstallationAddressesTx = await installationAdminFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    maticRealmDiamondAddress,
    gltr,
    pixelcraftAddress,
    aavegotchiDAOAddress,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
  );

  await setInstallationAddressesTx.wait();

  console.log("set tileDiamond addresses");
  const setTileAddressesTx = await tileFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    maticRealmDiamondAddress,
    gltr,
    pixelcraftAddress,
    aavegotchiDAOAddress
  );

  await setTileAddressesTx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
