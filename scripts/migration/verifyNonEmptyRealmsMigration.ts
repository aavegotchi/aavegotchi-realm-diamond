/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

// const realmDiamondAddress = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const realmDiamondAddress = '0x5258fCe3bE52b399AE210D875AD70BC2e3A55aD1'
const realmsBrigeAddress = process.env.REALMS_BRIDGE_ADDRESS_POLYGON as string

const BATCH_SIZE = 200

export default async function main() {
  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmDiamondAddress)

  const parcelIds = readParcelIds().slice(0, 1000)
  let promises = [];

  for (let i = 0; i < parcelIds.length; i++) {
    if (promises.length >= BATCH_SIZE) {
      console.log("Waiting promises to be settled")
      await Promise.allSettled(promises);
      console.log("Promises settled")
      promises = [];
    }

    const parcelId = parcelIds[i].tokenId
    let parcel = await readParcel(parcelId);

    console.log(`Verifying parcel with ID ${parcelId} at position ${i}`)

    promises.push(
      (async () => {
        try {
          // console.log(`Verifiying parcel with ID ${parcelId}`)
          const migratedParcel = await gettersAndSettersFacet.getParcel(parcelId)

          let message = `\nMigration gone wrong for parcel with ${parcelId}\n`
          let migrationGoneWrong = false
          if (realmsBrigeAddress !== migratedParcel.owner) {
            migrationGoneWrong = true
            message += `Incorrect owner, expected ${parcel.owner}, got ${migratedParcel.owner}\n`
          }
          if (parcel.parcelAddress !== migratedParcel.parcelAddress) {
            migrationGoneWrong = true
            message += `Incorrect parcelAddress, expected ${parcel.parcelAddress}, got ${migratedParcel.parcelAddress}\n`
          }
          if (parcel.parcelId !== migratedParcel.parcelId) {
            migrationGoneWrong = true
            message += `Incorrect parcelId, expected ${parcel.parcelId}, got ${migratedParcel.parcelId}\n`
          }
          if (parcel.coordinateX !== migratedParcel.coordinateX._hex) {
            migrationGoneWrong = true
            message += `Incorrect coordinateX, expected ${parcel.coordinateX.hex}, got ${migratedParcel.coordinateX._hex}\n`
          }
          if (parcel.coordinateY.hex !== migratedParcel.coordinateY._hex) {
            migrationGoneWrong = true
            message += `Incorrect coordinateY, expected ${parcel.coordinateY.hex}, got ${migratedParcel.coordinateY._hex}\n`
          }
          if (parcel.district.hex !== migratedParcel.district._hex) {
            migrationGoneWrong = true
            message += `Incorrect district, expected ${parcel.district.hex}, got ${migratedParcel.district._hex}\n`
          }
          if (parcel.size.hex !== migratedParcel.size._hex) {
            migrationGoneWrong = true
            message += `Incorrect size, expected ${parcel.size.hex}, got ${migratedParcel.size._hex}\n`
          }
          if (parcel.currentRound.hex !== migratedParcel.currentRound._hex) {
            migrationGoneWrong = true
            message += `Incorrect currentRound, expected ${parcel.currentRound.hex}, got ${migratedParcel.currentRound._hex}\n`
          }
          if (parcel.altarId.hex !== migratedParcel.altarId._hex) {
            migrationGoneWrong = true
            message += `Incorrect altarId, expected ${parcel.altarId.hex}, got ${migratedParcel.altarId._hex}\n`
          }
          if (parcel.upgradeQueueCapacity.hex !== migratedParcel.upgradeQueueCapacity._hex) {
            migrationGoneWrong = true
            message += `Incorrect upgradeQueueCapacity, expected ${parcel.upgradeQueueCapacity}, got ${migratedParcel.upgradeQueueCapacity}\n`
          }
          if (parcel.upgradeQueueLength.hex !== migratedParcel.upgradeQueueLength._hex) {
            migrationGoneWrong = true
            message += `Incorrect upgradeQueueLength, expected ${parcel.upgradeQueueLength.hex}, got ${migratedParcel.upgradeQueueLength._hex}\n`
          }
          if (parcel.lodgeId.hex !== migratedParcel.lodgeId._hex) {
            migrationGoneWrong = true
            message += `Incorrect lodgeId, expected ${parcel.lodgeId.hex}, got ${migratedParcel.lodgeId._hex}\n`
          }
          if (parcel.surveying !== migratedParcel.surveying) {
            migrationGoneWrong = true
            message += `Incorrect surveying, expected ${parcel.surveying}, got ${migratedParcel.surveying}\n`
          }
          if (parcel.harvesterCount !== migratedParcel.harvesterCount) {
            migrationGoneWrong = true
            message += `Incorrect harvesterCount, expected ${parcel.harvesterCount}, got ${migratedParcel.harvesterCount}\n`
          }

          let alchemicaBoostMigrationGoneWrong = false
          let alchemicaRemainingMigrationGoneWrong = false
          let alchemicaHarvestRateMigrationGoneWrong = false
          let lastUpdateTimestampMigrationGoneWrong = false
          let unclaimedAlchemicaMigrationGoneWrong = false
          for (let i = 0; i < 4; i++) {
            if (parcel.alchemicaBoost[i].hex !== migratedParcel.alchemicaBoost[i]._hex)
              alchemicaBoostMigrationGoneWrong = true
            if (parcel.alchemicaRemaining[i].hex !== migratedParcel.alchemicaRemaining[i]._hex)
              alchemicaRemainingMigrationGoneWrong = true
            if (parcel.alchemicaHarvestRate[i].hex !== migratedParcel.alchemicaHarvestRate[i]._hex)
              alchemicaHarvestRateMigrationGoneWrong = true
            if (parcel.lastUpdateTimestamp[i].hex !== migratedParcel.lastUpdateTimestamp[i]._hex)
              lastUpdateTimestampMigrationGoneWrong = true
            if (parcel.unclaimedAlchemica[i].hex !== migratedParcel.unclaimedAlchemica[i]._hex)
              unclaimedAlchemicaMigrationGoneWrong = true
          }

          if (alchemicaBoostMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect alchemicaBoost\n`
          }
          if (alchemicaRemainingMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect alchemicaRemaining\n`
          }
          if (alchemicaHarvestRateMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect alchemicaHarvestRate\n`
          }
          if (lastUpdateTimestampMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect lastUpdateTimestamp\n`
          }
          if (unclaimedAlchemicaMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect unclaimedAlchemica\n`
          }

          const { width, height } = getGridSize(BigNumber.from(parcel.size).toNumber())
          let buildGridMigrationGoneWrong = false
          let tileGridMigrationGoneWrong = false
          let startPositionBuildGridMigrationGoneWrong = false
          let startPositionTileGridMigrationGoneWrong = false
          for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
              if (parcel.buildGrid[i][j].hex !== migratedParcel.buildGrid[i][j]._hex)
                buildGridMigrationGoneWrong = true
              if (parcel.tileGrid[i][j].hex !== migratedParcel.tileGrid[i][j]._hex)
                tileGridMigrationGoneWrong = true
              if (parcel.startPositionBuildGrid[i][j].hex !== migratedParcel.startPositionBuildGrid[i][j]._hex)
                startPositionBuildGridMigrationGoneWrong = true
              if (parcel.startPositionTileGrid[i][j].hex !== migratedParcel.startPositionTileGrid[i][j]._hex)
                startPositionTileGridMigrationGoneWrong = true
            }
          }

          if (buildGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect buildGrid\n`
          }
          if (tileGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect tileGrid\n`
          }
          if (startPositionBuildGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect startPositionBuildGrid\n`
          }
          if (startPositionTileGridMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect startPositionTileGrid\n`
          }


          let roundAlchemicaMigrationGoneWrong = false
          let roundBaseAlchemicaMigrationGoneWrong = false
          for (let i = 0; i < parcel.currentRound; i++) {
            for (let j = 0; j < 4; j++) {
              if (parcel.roundAlchemica[i][j].hex !== migratedParcel.roundAlchemica[i][j]._hex)
              roundAlchemicaMigrationGoneWrong = true
              if (parcel.roundBaseAlchemica[i][j].hex !== migratedParcel.roundBaseAlchemica[i][j]._hex)
                roundBaseAlchemicaMigrationGoneWrong = true
            }
          }

          if (roundAlchemicaMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect roundAlchemica\n`
          }
          if (roundBaseAlchemicaMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect roundBaseAlchemica\n`
          }

          let reservoirsMigrationGoneWrong = false
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < parcel.reservoirs[i].length; j++) {
              if (parcel.reservoirs[i][j].hex !== migratedParcel.reservoirs[i][j]._hex)
                reservoirsMigrationGoneWrong = true
            }
          }

          if (reservoirsMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect reservoirs\n`
          }

          if (migrationGoneWrong) {
            fs.appendFileSync('non-empty-parcels-migration-errors.txt', `${message}\n`);
            console.log(message)
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