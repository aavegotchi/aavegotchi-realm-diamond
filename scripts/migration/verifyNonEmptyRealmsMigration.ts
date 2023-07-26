/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

const realmDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

const BATCH_SIZE = 200

export default async function main() {
  const realmDiamondAddress = '0x5258fCe3bE52b399AE210D875AD70BC2e3A55aD1'

  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmDiamondAddress)

  const parcelIds = readParcelIds().slice(0, 1000)
  let promises = [];

  for (let i = 0; i < parcelIds.length; i++) {
    if (promises.length >= BATCH_SIZE) {
      console.log("Waiting tx to be settled")
      await Promise.allSettled(promises);
      console.log("Transactions settled")
      promises = [];
    }

    const parcelId = parcelIds[i].tokenId
    let parcel = await readParcel(parcelId);

    promises.push(
      (async () => {
        try {
          // console.log(`Verifiying parcel with ID ${parcelId}`)
          const migratedParcel = await gettersAndSettersFacet.getParcel(parcelId)

          let message = ''
          let migrationGoneWrong = false
          if (parcel.owner !== migratedParcel.owner) {
            migrationGoneWrong = true
            message += `incorrect owner, expected ${parcel.owner}, got ${migratedParcel.owner}\n`
          }
          if (parcel.parcelAddress !== migratedParcel.parcelAddress) {
            migrationGoneWrong = true
            message += `incorrect parcelAddress, expected ${parcel.parcelAddress}, got ${migratedParcel.owner}\n`
          }
          if (parcel.parcelId !== migratedParcel.parcelId) {
            migrationGoneWrong = true
            message += `incorrect parcelId, expected ${parcel.parcelId}, got ${migratedParcel.owner}\n`
          }
          if (parcel.coordinateX !== migratedParcel.coordinateX) {
            migrationGoneWrong = true
            message += `incorrect coordinateX, expected ${parcel.coordinateX}, got ${migratedParcel.owner}\n`
          }
          if (parcel.coordinateY !== migratedParcel.coordinateY) {
            migrationGoneWrong = true
            message += `incorrect coordinateY, expected ${parcel.coordinateY}, got ${migratedParcel.owner}\n`
          }
          if (parcel.district !== migratedParcel.district) {
            migrationGoneWrong = true
            message += `incorrect district, expected ${parcel.district}, got ${migratedParcel.owner}\n`
          }
          if (parcel.size !== migratedParcel.size) {
            migrationGoneWrong = true
            message += `incorrect size, expected ${parcel.size}, got ${migratedParcel.owner}\n`
          }
          if (parcel.alchemicaBoost !== migratedParcel.alchemicaBoost) {
            migrationGoneWrong = true
            message += `incorrect alchemicaBoost, expected ${parcel.alchemicaBoost}, got ${migratedParcel.owner}\n`
          }
          if (parcel.alchemicaRemaining !== migratedParcel.alchemicaRemaining) {
            migrationGoneWrong = true
            message += `incorrect alchemicaRemaining, expected ${parcel.alchemicaRemaining}, got ${migratedParcel.owner}\n`
          }
          if (parcel.currentRound !== migratedParcel.currentRound) {
            migrationGoneWrong = true
            message += `incorrect currentRound, expected ${parcel.currentRound}, got ${migratedParcel.owner}\n`
          }
          if (parcel.alchemicaHarvestRate !== migratedParcel.alchemicaHarvestRate) {
            migrationGoneWrong = true
            message += `incorrect alchemicaHarvestRate, expected ${parcel.alchemicaHarvestRate}, got ${migratedParcel.owner}\n`
          }
          if (parcel.lastUpdateTimestamp !== migratedParcel.lastUpdateTimestamp) {
            migrationGoneWrong = true
            message += `incorrect lastUpdateTimestamp, expected ${parcel.lastUpdateTimestamp}, got ${migratedParcel.owner}\n`
          }
          if (parcel.unclaimedAlchemica !== migratedParcel.unclaimedAlchemica) {
            migrationGoneWrong = true
            message += `incorrect unclaimedAlchemica, expected ${parcel.unclaimedAlchemica}, got ${migratedParcel.owner}\n`
          }
          if (parcel.altarId !== migratedParcel.altarId) {
            migrationGoneWrong = true
            message += `incorrect altarId, expected ${parcel.altarId}, got ${migratedParcel.owner}\n`
          }
          if (parcel.upgradeQueueCapacity !== migratedParcel.upgradeQueueCapacity) {
            migrationGoneWrong = true
            message += `incorrect upgradeQueueCapacity, expected ${parcel.upgradeQueueCapacity}, got ${migratedParcel.owner}\n`
          }
          if (parcel.upgradeQueueLength !== migratedParcel.upgradeQueueLength) {
            migrationGoneWrong = true
            message += `incorrect upgradeQueueLength, expected ${parcel.upgradeQueueLength}, got ${migratedParcel.owner}\n`
          }
          if (parcel.lodgeId !== migratedParcel.lodgeId) {
            migrationGoneWrong = true
            message += `incorrect lodgeId, expected ${parcel.lodgeId}, got ${migratedParcel.owner}\n`
          }
          if (parcel.surveying !== migratedParcel.surveying) {
            migrationGoneWrong = true
            message += `incorrect surveying, expected ${parcel.surveying}, got ${migratedParcel.owner}\n`
          }
          if (parcel.harvesterCount !== migratedParcel.harvesterCount) {
            migrationGoneWrong = true
            message += `incorrect harvesterCount, expected ${parcel.harvesterCount}, got ${migratedParcel.owner}\n`
          }

          const {width, height} =  getGridSize(parcel.size)
          let buildGridMigrationGoneWrong = false
          let tileGridMigrationGoneWrong = false
          let startPositionBuildGridMigrationGoneWrong = false
          let startPositionTileGridMigrationGoneWrong = false
          for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
              if (parcel.buildGrid[i][j].hex !== migratedParcel.buildGrid[i][j].hex)
                buildGridMigrationGoneWrong = true
              if (parcel.tileGrid[i][j].hex !== migratedParcel.tileGrid[i][j].hex)
                buildGridMigrationGoneWrong = true
              if (parcel.startPositionBuildGrid[i][j].hex !== migratedParcel.startPositionBuildGrid[i][j].hex)
                buildGridMigrationGoneWrong = true
              if (parcel.startPositionTileGrid[i][j].hex !== migratedParcel.startPositionTileGrid[i][j].hex)
                buildGridMigrationGoneWrong = true
            }
          }

          if (buildGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `incorrect buildGrid\n`
          }
          if (tileGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `incorrect tileGrid\n`
          }
          if (startPositionBuildGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `incorrect startPositionBuildGrid\n`
          }
          if (startPositionTileGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `incorrect startPositionTileGrid\n`
          }

          
        } catch (e) {
          console.log(e)
        }
      })()
    )
  }
  console.log("Settling")
  await Promise.allSettled(promises);
  console.log("Settled")
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

  // parcel.buildGrid = make2DArraySparse(parcel.buildGrid)
  // parcel.tileGrid = make2DArraySparse(parcel.tileGrid)
  // parcel.startPositionBuildGrid = make2DArraySparse(parcel.startPositionBuildGrid)
  // parcel.startPositionTileGrid = make2DArraySparse(parcel.startPositionTileGrid)

  return parcel
}

const getGridSize = (size) => {
  if (size === 0) {
    return {
      width: 8,
      height: 8
    }
  }

  if (size === 1) {
    return {
      width: 16,
      height: 16
    }
  }

  if (size === 2) {
    return {
      width: 32,
      height: 64
    }
  }

  if (size === 3) {
    return {
      width: 64,
      height: 32
    }
  }

  if (size === 4) {
    return {
      width: 64,
      height: 64
    }
  }
}

const printGrid = (grid, width, height) => {
  const coordinateToString = (v) => {
    try {
      return BigNumber.from(v.hex).toString()
    } catch (e) {
      return v.toString()
    }
  }

  let result = ''
  for (let i = 0; i < width; i++) {
    result += `${i}  `
  }
  result += '\n'

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      result += `${coordinateToString(grid[i][j])}  `
    }
    result += '\n'
  }
  console.log(result)
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

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}