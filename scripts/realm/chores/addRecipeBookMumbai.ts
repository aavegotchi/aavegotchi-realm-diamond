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
import { outputInstallation, outputTile } from "../realmHelpers";
import * as recipeBook from "../../../data/installations/recipeBook.json";
import {
  InstallationTypeInput,
  TileTypeInput,
  InstallationTypeOutput,
  TileTypeOutput,
  TestBeforeVars,
} from "../../../types";

export async function setAddresses() {
  const diamondAddress = "0x1cefe47444e5597368fF81D083dCDd8C4FECeBdE";
  const installationDiamond = "0x7bC1d8C927a61c43c359E350333Ac5343a3Ef0F5";
  const tileDiamond = "0xEb4dF3a989ef3a03c8eb7232d3D7Ae069B1Ec577";
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

  // let batch1: any = recipeBook.slice(4, 34);
  // let batch2: any = recipeBook.slice(34, 64);
  // let batch3: any = recipeBook.slice(64, 94);
  // let batch4: any = recipeBook.slice(94, 124);
  // let batch5: any = recipeBook.slice(124, 140);

  // const converted1: InstallationTypeInput[] = batch1.map((inst) =>
  //   outputInstallation(inst)
  // );
  // const converted2: InstallationTypeInput[] = batch2.map((inst) =>
  //   outputInstallation(inst)
  // );
  // const converted3: InstallationTypeInput[] = batch3.map((inst) =>
  //   outputInstallation(inst)
  // );
  // const converted4: InstallationTypeInput[] = batch4.map((inst) =>
  //   outputInstallation(inst)
  // );
  // const converted5: InstallationTypeInput[] = batch5.map((inst) =>
  //   outputInstallation(inst)
  // );

  // console.log("edit installation types");
  // const id1 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 1,
  //   installationType: 0,
  //   level: 1,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [3000, 1500, 2000, 750],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 9000,
  //   spillRate: 50,
  //   upgradeQueueBoost: 1,
  //   craftTime: 0,
  //   deprecated: false,
  //   nextLevelId: 2,
  //   prerequisites: [0, 0],
  //   name: "LE Golden Altaar Level 1",
  // });
  // const id2 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 2,
  //   installationType: 0,
  //   level: 2,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [300, 150, 75, 10],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 8000,
  //   spillRate: 45,
  //   upgradeQueueBoost: 1,
  //   craftTime: 65000,
  //   deprecated: false,
  //   nextLevelId: 3,
  //   prerequisites: [1, 0],
  //   name: "LE Golden Altaar Level 2",
  // });
  // const id3 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 3,
  //   installationType: 0,
  //   level: 3,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [600, 300, 150, 20],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 7000,
  //   spillRate: 40,
  //   upgradeQueueBoost: 1,
  //   craftTime: 160000,
  //   deprecated: false,
  //   nextLevelId: 4,
  //   prerequisites: [2, 0],
  //   name: "LE Golden Altaar Level 3",
  // });
  // const id4 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 4,
  //   installationType: 0,
  //   level: 4,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [1000, 750, 375, 100],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 6000,
  //   spillRate: 35,
  //   upgradeQueueBoost: 1,
  //   craftTime: 320000,
  //   deprecated: false,
  //   nextLevelId: 5,
  //   prerequisites: [3, 0],
  //   name: "LE Golden Altaar Level 4",
  // });
  // const id5 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 5,
  //   installationType: 0,
  //   level: 5,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [2000, 1500, 750, 200],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 5000,
  //   spillRate: 30,
  //   upgradeQueueBoost: 1,
  //   craftTime: 475000,
  //   deprecated: false,
  //   nextLevelId: 6,
  //   prerequisites: [4, 0],
  //   name: "LE Golden Altaar Level 5",
  // });
  // const id6 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 6,
  //   installationType: 0,
  //   level: 6,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [4000, 3000, 1500, 400],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 4000,
  //   spillRate: 25,
  //   upgradeQueueBoost: 1,
  //   craftTime: 630000,
  //   deprecated: false,
  //   nextLevelId: 7,
  //   prerequisites: [5, 0],
  //   name: "LE Golden Altaar Level 6",
  // });
  // const id7 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 7,
  //   installationType: 0,
  //   level: 7,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [5000, 7500, 3750, 1500],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 3000,
  //   spillRate: 20,
  //   upgradeQueueBoost: 1,
  //   craftTime: 1250000,
  //   deprecated: false,
  //   nextLevelId: 8,
  //   prerequisites: [6, 0],
  //   name: "LE Golden Altaar Level 7",
  // });
  // const id8 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 8,
  //   installationType: 0,
  //   level: 8,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [10000, 15000, 7500, 3000],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 2000,
  //   spillRate: 15,
  //   upgradeQueueBoost: 1,
  //   craftTime: 1900000,
  //   deprecated: false,
  //   nextLevelId: 9,
  //   prerequisites: [7, 0],
  //   name: "LE Golden Altaar Level 8",
  // });
  // const id9 = outputInstallation({
  //   Installation: "LE Golden Altaar",
  //   id: 9,
  //   installationType: 0,
  //   level: 9,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [20000, 30000, 15000, 6000],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 1000,
  //   spillRate: 10,
  //   upgradeQueueBoost: 1,
  //   craftTime: 3200000,
  //   deprecated: false,
  //   nextLevelId: 0,
  //   prerequisites: [8, 0],
  //   name: "LE Golden Altaar Level 9",
  // });

  // const id10 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 10,
  //   installationType: 0,
  //   level: 1,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [0, 0, 0, 0],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 9000,
  //   spillRate: 50,
  //   upgradeQueueBoost: 1,
  //   craftTime: 0,
  //   deprecated: false,
  //   nextLevelId: 11,
  //   prerequisites: [0, 0],
  //   name: "Aaltar Level 1",
  // });

  // const id11 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 11,
  //   installationType: 0,
  //   level: 2,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [300, 150, 75, 10],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 8000,
  //   spillRate: 45,
  //   upgradeQueueBoost: 1,
  //   craftTime: 65000,
  //   deprecated: false,
  //   nextLevelId: 12,
  //   prerequisites: [1, 0],
  //   name: "Aaltar Level 2",
  // });
  // const id12 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 12,
  //   installationType: 0,
  //   level: 3,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [600, 300, 150, 20],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 7000,
  //   spillRate: 40,
  //   upgradeQueueBoost: 1,
  //   craftTime: 160000,
  //   deprecated: false,
  //   nextLevelId: 13,
  //   prerequisites: [2, 0],
  //   name: "Aaltar Level 3",
  // });
  // const id13 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 13,
  //   installationType: 0,
  //   level: 4,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [1000, 750, 375, 100],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 6000,
  //   spillRate: 35,
  //   upgradeQueueBoost: 1,
  //   craftTime: 320000,
  //   deprecated: false,
  //   nextLevelId: 14,
  //   prerequisites: [3, 0],
  //   name: "Aaltar Level 4",
  // });
  // const id14 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 14,
  //   installationType: 0,
  //   level: 5,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [2000, 1500, 750, 200],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 5000,
  //   spillRate: 30,
  //   upgradeQueueBoost: 1,
  //   craftTime: 475000,
  //   deprecated: false,
  //   nextLevelId: 15,
  //   prerequisites: [4, 0],
  //   name: "Aaltar Level 5",
  // });
  // const id15 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 15,
  //   installationType: 0,
  //   level: 6,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [4000, 3000, 1500, 400],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 4000,
  //   spillRate: 25,
  //   upgradeQueueBoost: 1,
  //   craftTime: 630000,
  //   deprecated: false,
  //   nextLevelId: 16,
  //   prerequisites: [5, 0],
  //   name: "Aaltar Level 6",
  // });
  // const id16 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 16,
  //   installationType: 0,
  //   level: 7,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [5000, 7500, 3750, 1500],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 3000,
  //   spillRate: 20,
  //   upgradeQueueBoost: 1,
  //   craftTime: 1250000,
  //   deprecated: false,
  //   nextLevelId: 17,
  //   prerequisites: [6, 0],
  //   name: "Aaltar Level 7",
  // });
  // const id17 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 17,
  //   installationType: 0,
  //   level: 8,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [10000, 15000, 7500, 3000],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 2000,
  //   spillRate: 15,
  //   upgradeQueueBoost: 1,
  //   craftTime: 1900000,
  //   deprecated: false,
  //   nextLevelId: 18,
  //   prerequisites: [7, 0],
  //   name: "Aaltar Level 8",
  // });
  // const id18 = outputInstallation({
  //   Installation: "Aaltar",
  //   id: 18,
  //   installationType: 0,
  //   level: 9,
  //   width: 2,
  //   height: 2,
  //   alchemicaType: 0,
  //   alchemicaCost: [20000, 30000, 15000, 6000],
  //   harvestRate: 0,
  //   capacity: 0,
  //   spillRadius: 1000,
  //   spillRate: 10,
  //   upgradeQueueBoost: 1,
  //   craftTime: 3200000,
  //   deprecated: false,
  //   nextLevelId: 0,
  //   prerequisites: [8, 0],
  //   name: "Aaltar Level 9",
  // });

  // console.log("tx1");
  // const tx1 = await installationAdminFacet.editInstallationType(1, id1);
  // await tx1.wait();
  // console.log("tx2");
  // const tx2 = await installationAdminFacet.editInstallationType(2, id2);
  // await tx2.wait();
  // console.log("tx3");
  // const tx3 = await installationAdminFacet.editInstallationType(3, id3);
  // await tx3.wait();
  // console.log("tx4");
  // const tx4 = await installationAdminFacet.editInstallationType(4, id4);
  // await tx4.wait();
  // console.log("tx5");
  // const tx5 = await installationAdminFacet.editInstallationType(5, id5);
  // await tx5.wait();
  // console.log("tx6");
  // const tx6 = await installationAdminFacet.editInstallationType(6, id6);
  // await tx6.wait();
  // console.log("tx7");
  // const tx7 = await installationAdminFacet.editInstallationType(7, id7);
  // await tx7.wait();
  // console.log("tx8");
  // const tx8 = await installationAdminFacet.editInstallationType(8, id8);
  // await tx8.wait();
  // console.log("tx9");
  // const tx9 = await installationAdminFacet.editInstallationType(9, id9);
  // await tx9.wait();
  // console.log("tx10");
  // const tx10 = await installationAdminFacet.editInstallationType(10, id10);
  // await tx10.wait();
  // console.log("tx11");
  // const tx11 = await installationAdminFacet.editInstallationType(11, id11);
  // await tx11.wait();
  // console.log("tx12");
  // const tx12 = await installationAdminFacet.editInstallationType(12, id12);
  // await tx12.wait();
  // console.log("tx13");
  // const tx13 = await installationAdminFacet.editInstallationType(13, id13);
  // await tx13.wait();
  // console.log("tx14");
  // const tx14 = await installationAdminFacet.editInstallationType(14, id14);
  // await tx14.wait();
  // console.log("tx15");
  // const tx15 = await installationAdminFacet.editInstallationType(15, id15);
  // await tx15.wait();
  // console.log("tx16");
  // const tx16 = await installationAdminFacet.editInstallationType(16, id16);
  // await tx16.wait();
  // console.log("tx17");
  // const tx17 = await installationAdminFacet.editInstallationType(17, id17);
  // await tx17.wait();
  // console.log("tx18");
  // const tx18 = await installationAdminFacet.editInstallationType(18, id18);
  // await tx18.wait();

  // console.log("add installation types");
  // const addTx = await installationAdminFacet.addInstallationTypes(converted1);
  // await addTx.wait();
  // console.log("tx2");
  // const addTx2 = await installationAdminFacet.addInstallationTypes(converted2);
  // await addTx2.wait();
  // console.log("tx3");
  // const addTx3 = await installationAdminFacet.addInstallationTypes(converted3);
  // await addTx3.wait();
  // console.log("tx4");
  // const addTx4 = await installationAdminFacet.addInstallationTypes(converted4);
  // await addTx4.wait();
  // console.log("tx5");
  // const addTx5 = await installationAdminFacet.addInstallationTypes(converted5);
  // await addTx5.wait();

  // console.log("add tiles types");
  // const tileTypes: TileTypeInput[] = [
  //   {
  //     id: 0,
  //     name: "The Void",
  //     width: 1,
  //     height: 1,
  //     deprecated: true,
  //     tileType: 0,
  //     alchemicaCost: [0, 0, 0, 0],
  //     craftTime: 0,
  //   },
  //   {
  //     id: 1,
  //     name: "LE Golden Tile - Gotchiverse",
  //     width: 8,
  //     height: 8,
  //     deprecated: true,
  //     tileType: 0,
  //     alchemicaCost: [25, 25, 75, 25],
  //     craftTime: 0,
  //   },
  //   {
  //     id: 2,
  //     name: "LE Golden Tile - Portal",
  //     width: 8,
  //     height: 8,
  //     deprecated: false,
  //     tileType: 0,
  //     alchemicaCost: [25, 25, 75, 25],
  //     craftTime: 0,
  //   },
  //   {
  //     id: 3,
  //     name: "LE Golden Tile - Gotchi",
  //     width: 2,
  //     height: 2,
  //     deprecated: false,
  //     tileType: 0,
  //     alchemicaCost: [25, 25, 75, 25],
  //     craftTime: 0,
  //   },
  // ];
  // const outputTiles: any = tileTypes.map((tile) => outputTile(tile));
  // const tx = await tileFacet.addTileTypes(outputTiles);
  // await tx.wait();

  const tiles = await tileFacet.getTileTypes([0, 1, 2, 3]);
  console.log(tiles);
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
