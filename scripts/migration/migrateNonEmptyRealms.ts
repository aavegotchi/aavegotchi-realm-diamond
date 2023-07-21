/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

const realmDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

const BATCH_SIZE = 1

export default async function main() {
  const realmDiamondAddress = await deployRealmDiamond()

  const signerAddress = await ethers.provider.getSigner().getAddress();
  const migrationFacet: MigrationFacet = await ethers.getContractAt("MigrationFacet", realmDiamondAddress)

  const transactionCount = await ethers.provider.getTransactionCount(signerAddress, "latest");

  const parcelIds = readParcelIds()
  let promises = [];

  for (let i = 0; i < parcelIds.length; i++) {
    if (promises.length == BATCH_SIZE) {
      await Promise.allSettled(promises);
      promises = [];
    }

    const parcelId = parcelIds[i].tokenId
    let parcel = await readParcel(parcelId);
    // if 

    promises.push(
      (async () => {
        try {
          console.log(`\nReading parcel with ID ${parcelId}`)

          const nonce = transactionCount + i
          await migrationFacet.migrateParcel(parcelId, parcel, { nonce, gasLimit: 20000000 })
          console.log(`Migrated parcel with ID ${parcelId}`);

          console.log(`Saving migrated parcel to non-empty-migrated-parcels.txt`)
          fs.appendFileSync('non-empty-migrated-parcels.txt', `${parcelId}\n`);
          console.log(`Saved migrated parcel to non-empty-migrated-parcels.txt`)
        } catch (e) {
          // console.log('\n')
          // console.log(e.message);

          console.log(`Logging migrating error to error-non-empty-migrated-parcels.txt`)
          fs.appendFileSync('error-non-empty-migrated-parcels.txt', `${parcelId}\n`);
          console.log(`Logged migration error to error-non-empty-migrated-parcels.txt`)
        }
      })()
    );
  }

  console.log("Settling")
  await Promise.allSettled(promises);
  promises = [];
}

const readParcelIds = () => {
  const rawParcelData = fs.readFileSync(`nonEmptyParcelIds.json`)
  const parcel = JSON.parse(rawParcelData)
  return parcel
}

const readParcel = (parcelId: string | number) => {
  const rawParcelData = fs.readFileSync(`parcels/parcel-${parcelId}.json`)
  const parcel = JSON.parse(rawParcelData)

  parcel.buildGrid = make2DArraySparse(parcel.buildGrid)
  parcel.tileGrid = make2DArraySparse(parcel.tileGrid)
  parcel.startPositionBuildGrid = make2DArraySparse(parcel.startPositionBuildGrid)
  parcel.startPositionTileGrid = make2DArraySparse(parcel.startPositionTileGrid)

  return parcel
}

export const make2DArraySparse = (array) => {
  let sparseArray = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      if (BigNumber.from(array[i][j].hex).toString() !== BigNumber.from(0).toString()) {
        sparseArray.push(i);
        sparseArray.push(j);
        sparseArray.push(array[i][j]);
      }
    }
  }
  return sparseArray;
}

const printGrid = (grid, width, height) => {
  for (let i = 0; i < width; i++) {
    console.log(grid[i].slice(0, height).map(v => BigNumber.from(v.hex).toString()))
  }
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
