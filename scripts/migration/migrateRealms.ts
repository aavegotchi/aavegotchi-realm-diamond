/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../../scripts/deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

const realmDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

export default async function main() {
  const realmDiamondAddress = await deployRealmDiamond()

  const migrationFacet: MigrationFacet = await ethers.getContractAt("MigrationFacet", realmDiamondAddress)
  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmDiamondAddress)

  console.log("\nParcel Input")
  const parcel = await readParcel("110");
  console.log(parcel.owner)
  console.log(parcel.size)


  await migrationFacet.migrateParcel(91, parcel);

  const parcelOutput = await gettersAndSettersFacet.getParcel(91)
}

const readParcel = async (parcelId: string) => {
  const rawParcelData = fs.readFileSync(`parcels/parcel-${parcelId}.json`)
  const parcel = JSON.parse(rawParcelData)

  parcel.buildGrid = make2DArraySparse(parcel.buildGrid),
  parcel.tileGrid = make2DArraySparse(parcel.buildGrid)
  parcel.startPositionBuildGrid = make2DArraySparse(parcel.buildGrid)
  parcel.startPositionTileGrid = make2DArraySparse(parcel.buildGrid)
  
  return parcel
}

export const make2DArraySparse = (array) => {
  let sparseArray = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      if (BigNumber.from(array[i][j]) !== BigNumber.from(0)) {
        sparseArray.push(i);
        sparseArray.push(j);
        sparseArray.push(array[i][j]);
      }
    }
  }
  return sparseArray;
}

const deployRealmDiamond = async () => {
  let realmDiamond
  ({
    // installationDiamond: installationsDiamond,
    // alchemica: alchemica,
    realmDiamond: realmDiamond,
  } = await deploy());
  
  return realmDiamond.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
