/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

const realmDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

const parcelIds = [91, 110, 130, 141, 154, 157, 163, 196, 203, 204, 222, 241]

export default async function main() {
  
  const realmDiamondAddress = await deployRealmDiamond()
  
  const migrationFacet: MigrationFacet = await ethers.getContractAt("MigrationFacet", realmDiamondAddress)
  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmDiamondAddress)
  
  for (const parcelId of parcelIds) {
    console.log(`\nReading parcel with ID ${parcelId}`)
    let parcel = await readParcel(parcelId);
    
    parcel = {
      owner: '0xaed39f9013fe44deb694203d9d12ea4029edac49',
      parcelAddress: 'helping-corner-locked',
      parcelId: 'C-3996-2864-V',
      tokenId: '1000',
      coordinateX: '3996',
      coordinateY: '2864',
      district: '1',
      size: '2',
      alchemicaBoost: [ '0', '0', '0', '0' ],
      alchemicaRemaining: [ '0', '0', '0', '0' ],
    }

    console.log(`Migrating parcel with ID ${parcelId}`)
    const tx = await migrationFacet.migrateParcel(91, parcel); 
    tx.wait()
    console.log(`Migrated Parcel with ID ${parcelId}`)

    console.log(`Saving migrated parcel to saved-parcels.txt`)
    fs.appendFileSync('saved-parcels.txt', `${parcelId}\n`);
    console.log(`Saved migrated parcel to saved-parcels.txt`)
  }
  // console.log("\nParcel Input")



  // const parcelOutput = await gettersAndSettersFacet.getParcel(91)
}

const readParcel = async (parcelId: string | number) => {
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
