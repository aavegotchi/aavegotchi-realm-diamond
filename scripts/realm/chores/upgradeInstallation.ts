import { Signer } from "ethers";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers, network } from "hardhat";
import {
  RealmFacet,
  AlchemicaFacet,
  InstallationAdminFacet,
  InstallationFacet,
  AlchemicaToken,
  TileFacet,
  ERC721Facet,
} from "../../../typechain";
import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  maticDiamondAddress,
  pixelcraftAddress,
  gasPrice,
} from "../../helperFunctions";
import { alchemicaTotals, boostMultipliers } from "../../setVars";
import {
  genEquipInstallationSignature,
  genUpgradeInstallationSignature,
} from "../realmHelpers";
import { UpgradeQueue } from "../../../types";

export async function setAddresses() {
  const diamondAddress = "0x9351e6705590756BAc83f591aDE9f61De5998a84";
  const installationDiamond = "0x6F8cFe6757F716039498dE53696b1aB5C66Ab428";
  const tileDiamond = "0xf65848AF98015463F256877b6A4FaD03e71f6cD1";
  const owner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const fudAddress = "0x447fd7d4F6D7efab9a10786e5804192c4Acbd32F";
  const fomoAddress = "0xEb156a435CF453F0F2D0b7144C8a2D0224F7D73A";
  const alphaAddress = "0x79F80B48543F4213fbFaB158bE9EF7f89C9fFC74";
  const kekAddress = "0xEdA7e5A9674a70f57C09D6037c8Ac789a18b9410";
  const maticAavegotchiDiamondAddress =
    "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const vrfCoordinator = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.MUMBAI_REALM_PK); // PK should start with '0x'

  let fud = (await ethers.getContractAt(
    "AlchemicaToken",
    fudAddress
  )) as AlchemicaToken;

  let fomo = (await ethers.getContractAt(
    "AlchemicaToken",
    fomoAddress
  )) as AlchemicaToken;

  let alpha = (await ethers.getContractAt(
    "AlchemicaToken",
    alphaAddress
  )) as AlchemicaToken;

  let kek = (await ethers.getContractAt(
    "AlchemicaToken",
    kekAddress
  )) as AlchemicaToken;

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    diamondAddress
  )) as RealmFacet;

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    diamondAddress
  )) as AlchemicaFacet;

  let installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    installationDiamond
  )) as InstallationFacet;

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    installationDiamond
  )) as InstallationAdminFacet;

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    tileDiamond
  )) as TileFacet;

  let erc721Facet = (await ethers.getContractAt(
    "ERC721Facet",
    diamondAddress
  )) as ERC721Facet;

  const greatPortalCapacity: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [
    ethers.utils.parseUnits("1250000000"),
    ethers.utils.parseUnits("625000000"),
    ethers.utils.parseUnits("312500000"),
    ethers.utils.parseUnits("125000000"),
  ];

  // let tx = await alchemicaFacet.setVars(
  //   //@ts-ignore
  //   alchemicaTotals(),
  //   boostMultipliers,
  //   greatPortalCapacity,
  //   installationDiamond,
  //   vrfCoordinator,
  //   linkAddress,
  //   [
  //     "0x8B55bee31a3eA3179873a9D9DA4b8022BEB70e80",
  //     "0x51FB5995d5d1A037f7Cbcc05071BDf5B67f2cFCf",
  //     "0xe4978101d2D4Bbe6392aDd7B5183087e8c4c037e",
  //     "0xEF26948bea74912390295C567F6cfd62310eA7fD",
  //   ],
  //   "0x3F33C826DFE31A4773BD604D4576cAb687b0C494",
  //   ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
  //   owner,
  //   tileDiamond,
  //   "0xC3688369C695D878d2632b20dFe5efFD18256339", //aavegotchiDiamond mumbai
  //   { gasPrice: gasPrice }
  // );

  // await tx.wait();

  // const tx = await erc721Facet.transferFrom(
  //   owner,
  //   "0xb3bEE557bEf65bE19EBF7AD83B4F388856D561E4",
  //   3
  // );

  // await tx.wait();

  // const tx = await installationFacet.craftInstallations([4]);

  // await tx.wait();

  // const upgradeQueueAlt: UpgradeQueue = {
  //   parcelId: 0,
  //   coordinateX: 0,
  //   coordinateY: 0,
  //   installationId: 1,
  //   readyBlock: 0,
  //   claimed: false,
  //   owner,
  // };
  // const signatureAlt = await genUpgradeInstallationSignature(0, 0, 0, 1);
  // await installationFacet.upgradeInstallation(upgradeQueueAlt, signatureAlt);

  const queue = await installationFacet.getUpgradeQueue(owner);

  console.log(queue);
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
