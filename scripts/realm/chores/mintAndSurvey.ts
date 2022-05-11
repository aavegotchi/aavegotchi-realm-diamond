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

  // console.log("set game active");
  // const setGameTx = await realmFacet.setGameActive(true, {
  //   gasPrice: 500000000000,
  // });

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
  //   prerequisites: [0, 0],
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

  // const altar: any = {
  //   name: "Altar",
  //   level: 1,
  //   nextLevelId: 2,
  //   prerequisites: [0, 0],
  //   width: 2,
  //   height: 2,
  //   deprecated: false,
  //   installationType: 0,
  //   alchemicaType: 0,
  //   alchemicaCost: [
  //     ethers.utils.parseUnits("100"),
  //     ethers.utils.parseUnits("100"),
  //     ethers.utils.parseUnits("100"),
  //     ethers.utils.parseUnits("100"),
  //   ],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 9000,
  //   spillRate: 50,
  //   upgradeQueueBoost: 1,
  //   craftTime: 0,
  // };

  // const harvester: any = {
  //   name: "FUD Harvester level 1",
  //   level: 1,
  //   nextLevelId: 0,
  //   prerequisites: [1, 0],
  //   width: 2,
  //   height: 2,
  //   deprecated: false,
  //   installationType: 1,
  //   alchemicaType: 1,
  //   alchemicaCost: [
  //     ethers.utils.parseUnits("120"),
  //     ethers.utils.parseUnits("60"),
  //     0,
  //     0,
  //   ],
  //   harvestRate: ethers.utils.parseUnits("14"),
  //   capacity: 0,
  //   spillRadius: 0,
  //   spillRate: 0,
  //   upgradeQueueBoost: 0,
  //   craftTime: 0,
  // };

  // const reservoir: any = {
  //   name: "FUD Reservoir level 1",
  //   level: 1,
  //   nextLevelId: 0,
  //   prerequisites: [1, 0],
  //   width: 2,
  //   height: 2,
  //   deprecated: false,
  //   installationType: 2,
  //   alchemicaType: 1,
  //   alchemicaCost: [
  //     ethers.utils.parseUnits("290"),
  //     ethers.utils.parseUnits("100"),
  //     0,
  //     0,
  //   ],
  //   harvestRate: 0,
  //   capacity: ethers.utils.parseUnits("5"),
  //   spillRadius: 0,
  //   spillRate: 50,
  //   upgradeQueueBoost: 0,
  //   craftTime: 0,
  // };

  // console.log("set installation types");
  // const addTx = await installationAdminFacet.addInstallationTypes([
  //   theVoid,
  //   altar,
  //   harvester,
  //   reservoir,
  // ]);

  // await addTx.wait();

  // console.log("set installation types");
  // const edit1Tx = await installationAdminFacet.editInstallationType(1, altar);
  // await edit1Tx.wait();

  // const edit2Tx = await installationAdminFacet.editInstallationType(
  //   2,
  //   harvester
  // );
  // await edit2Tx.wait();

  // const edit3Tx = await installationAdminFacet.editInstallationType(
  //   3,
  //   reservoir
  // );
  // await edit3Tx.wait();
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

  const setTx = await tileFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    diamondAddress,
    diamondAddress,
    diamondAddress,
    diamondAddress
  );
  await setTx.wait();
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
