import { Signer } from "ethers";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers, network } from "hardhat";
import {
  RealmFacet,
  AlchemicaFacet,
  InstallationAdminFacet,
  InstallationFacet,
  AlchemicaToken,
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
import { genEquipInstallationSignature } from "../realmHelpers";

export async function setAddresses() {
  const diamondAddress = "0x6bb645178AEd185980e9a9BAB92aA96eB405D7A4";
  const installationDiamond = "0xbFFF3364Cd77Bf69048244b535F3435ff69e63DB";
  const owner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const fudAddress = "0x75482FcFDF88df0A1c7Afc66411d27db2388C4b5";
  const fomoAddress = "0xf9b19fe41Ab12A7Ab858D4b83212FbC51C970c13";
  const alphaAddress = "0xCA9a214788DD68BB2468794073A24003C975DDbD";
  const kekAddress = "0x3d8D786edE779113938e75BD44B5c8d02Ab0Cf28";
  const maticAavegotchiDiamondAddress =
    "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

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

  // console.log("set game active");
  // const setGameTx = await realmFacet.setGameActive(true);

  // await setGameTx.wait();

  // const parcels: any = [];

  // parcels.push({
  //   coordinateX: 0,
  //   coordinateY: 0,
  //   district: 1,
  //   parcelId: "a-b-c",
  //   parcelAddress: "a-b-c",
  //   size: 0,
  //   boost: [0, 0, 0, 0],
  // });

  // parcels.push({
  //   coordinateX: 1,
  //   coordinateY: 1,
  //   district: 2,
  //   parcelId: "a-b-c",
  //   parcelAddress: "a-b-c",
  //   size: 1,
  //   boost: [0, 0, 0, 0],
  // });

  // console.log("mint parcel");
  // const mintTx = await realmFacet.mintParcels(owner, [0, 1], parcels);

  // await mintTx.wait();

  // const theVoid: any = {
  //   name: "The Void",
  //   level: 1,
  //   nextLevelId: 0,
  //   prerequisites: [],
  //   width: 1,
  //   height: 1,
  //   deprecated: true,
  //   installationType: 0,
  //   alchemicaType: 0,
  //   alchemicaCost: [0, 0, 0, 0],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 0,
  //   spillRate: 0,
  //   upgradeQueueBoost: 0,
  //   craftTime: 0,
  // };

  const altar: any = {
    name: "Altar",
    level: 1,
    nextLevelId: 2,
    prerequisites: [],
    width: 2,
    height: 2,
    deprecated: false,
    installationType: 0,
    alchemicaType: 0,
    alchemicaCost: [
      ethers.utils.parseUnits("100"),
      ethers.utils.parseUnits("100"),
      ethers.utils.parseUnits("100"),
      ethers.utils.parseUnits("100"),
    ],
    harvestRate: 0,
    capacity: 0,
    spillRadius: 9000,
    spillRate: 50,
    upgradeQueueBoost: 1,
    craftTime: 0,
  };

  const harvester: any = {
    name: "FUD Harvester level 1",
    level: 1,
    nextLevelId: 0,
    prerequisites: [],
    width: 2,
    height: 2,
    deprecated: false,
    installationType: 1,
    alchemicaType: 1,
    alchemicaCost: [
      ethers.utils.parseUnits("120"),
      ethers.utils.parseUnits("60"),
      0,
      0,
    ],
    harvestRate: ethers.utils.parseUnits("14"),
    capacity: 0,
    spillRadius: 0,
    spillRate: 0,
    upgradeQueueBoost: 0,
    craftTime: 0,
  };

  const reservoir: any = {
    name: "FUD Reservoir level 1",
    level: 1,
    nextLevelId: 0,
    prerequisites: [],
    width: 2,
    height: 2,
    deprecated: false,
    installationType: 2,
    alchemicaType: 1,
    alchemicaCost: [
      ethers.utils.parseUnits("290"),
      ethers.utils.parseUnits("100"),
      0,
      0,
    ],
    harvestRate: 0,
    capacity: ethers.utils.parseUnits("5"),
    spillRadius: 0,
    spillRate: 50,
    upgradeQueueBoost: 0,
    craftTime: 0,
  };

  // console.log("get installation types");
  const addTx = await installationAdminFacet.addInstallationTypes([
    harvester,
    reservoir,
  ]);

  await addTx.wait();
  // const altar = await installationFacet.getInstallationTypes([1]);
  // console.log(altar);

  //@ts-ignore
  // const backendSigner = new ethers.Wallet(process.env.REALM_PK);

  // console.log("set installation addresses");
  // const setTx = await installationAdminFacet.setAddresses(
  //   maticAavegotchiDiamondAddress,
  //   diamondAddress,
  //   maticAavegotchiDiamondAddress,
  //   maticAavegotchiDiamondAddress,
  //   maticAavegotchiDiamondAddress,
  //   ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
  // );
  // await setTx.wait();

  // approooovee
  // console.log("approoooov");
  // const appFud = await fud.approve(
  //   installationDiamond,
  //   ethers.utils.parseUnits("10000000000000")
  // );
  // const appFomo = await fomo.approve(
  //   installationDiamond,
  //   ethers.utils.parseUnits("10000000000000")
  // );
  // const appAlpha = await alpha.approve(
  //   installationDiamond,
  //   ethers.utils.parseUnits("10000000000000")
  // );
  // const appKek = await kek.approve(
  //   installationDiamond,
  //   ethers.utils.parseUnits("10000000000000")
  // );

  // await appFud.wait();
  // await appFomo.wait();
  // await appAlpha.wait();
  // await appKek.wait();

  // console.log("craft altar");
  // const craftTx = await installationFacet.craftInstallations([1]);

  // await craftTx.wait();

  // console.log("equip altar");
  // const equipTx = await realmFacet.equipInstallation(
  //   0,
  //   1,
  //   0,
  //   0,
  //   await genEquipInstallationSignature(0, 1, 0, 0)
  // );

  // await equipTx.wait();

  // console.log("survey");
  // const surveyTx = await alchemicaFacet.startSurveying(0);

  // await surveyTx.wait();

  // const balance = await alchemicaFacet.getRealmAlchemica(0);
  // console.log("fud", ethers.utils.formatUnits(balance[0]));
  // console.log("fomo", ethers.utils.formatUnits(balance[1]));
  // console.log("alpha", ethers.utils.formatUnits(balance[2]));
  // console.log("kek", ethers.utils.formatUnits(balance[3]));
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
