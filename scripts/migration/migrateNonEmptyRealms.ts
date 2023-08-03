/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

const realmDiamondAddress = process.env.REALMS_DIAMOND_ADDRESS_GOTCHICHAIN as string
const realmsBrigeAddress = process.env.REALMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

const BATCH_SIZE = 60 //Making this bigger adds potetial points of failure (especically if you raise it above 100)
const gasPrice = 0

export default async function main() {
  const migrationFacet: MigrationFacet = await ethers.getContractAt("MigrationFacet", realmDiamondAddress)
  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmDiamondAddress)
  
  const signerAddress = await ethers.provider.getSigner().getAddress()
  let txCounter = await ethers.provider.getTransactionCount(signerAddress, "latest")
  
  const parcelIds = readParcelIds()
  let promises = [];

  for (let i = 0; i < parcelIds.length; i++) {
    if (promises.length >= BATCH_SIZE) {
      console.log("Waiting tx to be settled")
      await Promise.allSettled(promises);
      console.log("Transactions settled")
      promises = [];
    }

    const parcelId = parcelIds[i].tokenId
    let parcel = await readParcel(parcelId)
    parcel.owner = realmsBrigeAddress

    const allGridsLength = parcel.buildGrid.length +
      parcel.tileGrid.length +
      parcel.startPositionBuildGrid.length +
      parcel.startPositionTileGrid.length

    console.log(`\nMigrating parcel with ID ${parcelId}`)

    if (allGridsLength > 1500) {
      promises.push(
        (async () => {
          try {
            const nonce = txCounter
            console.log(`migrateParcel(), parcelId ${parcelId}, nonce ${nonce}`)
            const tx = await migrationFacet.migrateParcel(
              parcelId,
              {
                ...parcel,
                buildGrid: [],
                tileGrid: [],
                startPositionBuildGrid: [],
                startPositionTileGrid: []
              },
              {
                nonce,
                gasPrice,
                gasLimit: 20000000,
              }
            )
            await tx.wait()
            console.log(`migrateParcel() fineshed, parcelId ${parcelId}, nonce ${nonce}`)
          } catch (e) {
            console.log(e)
          }
        })()
      )
      txCounter++

      if (parcel.buildGrid.length > 1500) {
        while (parcel.buildGrid.length > 0) {
          const chunk = parcel.buildGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = txCounter
                console.log(`saveBuildGrid(2), parcelId ${parcelId}, nonce ${nonce}`)
                const tx = await migrationFacet.saveBuildGrid(
                  parcelId,
                  chunk,
                  {
                    nonce,
                    gasPrice,
                    gasLimit: 20000000,
                  }
                )
                await tx.wait()
                console.log(`saveBuildGrid(2) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
              } catch (e) {
                console.log(e)
              }
            })()
          )
          txCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              const nonce = txCounter
              console.log(`saveBuildGrid(1), parcelId ${parcelId}, nonce ${nonce}`)
              const tx = await migrationFacet.saveBuildGrid(
                parcelId,
                parcel.buildGrid,
                {
                  nonce,
                  gasPrice,
                  gasLimit: 20000000,
                }
              )
              await tx.wait()
              console.log(`saveBuildGrid(1) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
            } catch (e) {
              console.log(e)
            }
          })()
        )
        txCounter++
      }

      if (parcel.tileGrid.length > 1500) {
        while (parcel.tileGrid.length > 0) {
          const chunk = parcel.tileGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = txCounter
                console.log(`saveTileGrid(2), parcelId ${parcelId}, nonce ${nonce}`)
                const tx = await migrationFacet.saveTileGrid(
                  parcelId,
                  chunk,
                  {
                    nonce,
                    gasPrice,
                    gasLimit: 20000000,
                  }
                )
                await tx.wait()
                console.log(`saveTileGrid(2) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
              } catch (e) {
                console.log(e)
              }
            })()
          )
          txCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              const nonce = txCounter
              console.log(`saveTileGrid(1) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
              const tx = await migrationFacet.saveTileGrid(
                parcelId,
                parcel.tileGrid,
                {
                  nonce,
                  gasPrice,
                  gasLimit: 20000000,
                }
              )
              await tx.wait()
              console.log(`saveTileGrid(1) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
            } catch (e) {
              console.log(e)
            }
          })()
        )
        txCounter++
      }

      if (parcel.startPositionBuildGrid.length > 1500) {
        while (parcel.startPositionBuildGrid.length > 0) {
          const chunk = parcel.startPositionBuildGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = txCounter
                console.log(`saveStartPositionBuildGrid(2), parcelId ${parcelId}, nonce ${nonce}`)
                const tx = await migrationFacet.saveStartPositionBuildGrid(
                  parcelId,
                  chunk,
                  {
                    nonce,
                    gasPrice,
                    gasLimit: 20000000,
                  }
                )
                await tx.wait()
                console.log(`saveStartPositionBuildGrid(2) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
              } catch (e) {
                console.log(e)
              }
            })()
          )
          txCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              const nonce = txCounter
              console.log(`saveStartPositionBuildGrid(1), parcelId ${parcelId}, nonce ${nonce}`)
              const tx = await migrationFacet.saveStartPositionBuildGrid(
                parcelId,
                parcel.startPositionBuildGrid,
                {
                  nonce,
                  gasPrice,
                  gasLimit: 20000000,
                }
              )
              await tx.wait()
              console.log(`saveStartPositionBuildGrid(1) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
            } catch (e) {
              console.log(e)
            }
          })()
        )
        txCounter++
      }

      if (parcel.startPositionTileGrid.length > 1500) {
        while (parcel.startPositionTileGrid.length > 0) {
          const chunk = parcel.startPositionTileGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = txCounter
                console.log(`saveStartPositionTileGrid(2), parcelId ${parcelId}, nonce ${nonce}`)
                const tx = await migrationFacet.saveStartPositionTileGrid(
                  parcelId,
                  chunk,
                  {
                    nonce,
                    gasPrice,
                    gasLimit: 20000000,
                  }
                )
                await tx.wait()
                console.log(`saveStartPositionTileGrid(2) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
              } catch (e) {
                console.log(e)
              }
            })()
          )
          txCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              const nonce = txCounter
              console.log(`saveStartPositionTileGrid(1), parcelId ${parcelId}, nonce ${nonce}`)
              const tx = await migrationFacet.saveStartPositionTileGrid(
                parcelId,
                parcel.startPositionTileGrid,
                {
                  nonce,
                  gasPrice,
                  gasLimit: 20000000,
                }
              )
              await tx.wait()
              console.log(`saveStartPositionTileGrid(1) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
            } catch (e) {
              console.log(e)
            }
          })()
        )
        txCounter++
      }
    } else {
      promises.push(
        (async () => {
          try {
            const nonce = txCounter
            console.log(`migrateParcel(1), parcelId ${parcelId}, nonce ${nonce}`)
            const tx = await migrationFacet.migrateParcel(parcelId, parcel, {
              nonce, 
              gasPrice,
              gasLimit: 20000000,
            })
            await tx.wait()
            console.log(`migrateParcel(1) fineshed, parcelId ${parcelId}, nonce ${nonce}`)
          } catch (e) {
            console.log(e);
          }
        })()
      );
      txCounter++
    }
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

const countGridBiggerThan1500 = async () => {
  const parcelIds = readParcelIds()
  for (let i = 0; i < parcelIds.length; i++) {
    try {
      console.log(`Going again, ${i} of ${parcelIds.length}`)
      const parcelId = parcelIds[i].tokenId
      let parcel = await readParcel(parcelId);

      const allGridsLength = parcel.buildGrid.length +
        parcel.tileGrid.length +
        parcel.startPositionBuildGrid.length +
        parcel.startPositionTileGrid.length
      if (allGridsLength > 1500) {
        fs.appendFileSync('test.txt', `\n parcel with id ${parcelId}, ALL_SUM_GRIDS > 1500`);
      }

      if (parcel.buildGrid.length > 1500) {
        fs.appendFileSync('test.txt', `parcel with id ${parcelId}, BUILD_GRID > 1500`);
      }

      if (parcel.tileGrid.length > 1500) {
        fs.appendFileSync('test.txt', `parcel with id ${parcelId}, TILE_GRID > 1500`);
      }

      if (parcel.startPositionBuildGrid.length > 1500) {
        fs.appendFileSync('test.txt', `parcel with id ${parcelId}, START_POSITION_BUILD_GRID > 1500`);
      }

      if (parcel.startPositionTileGrid.length > 1500) {
        fs.appendFileSync('test.txt', `parcel with id ${parcelId}, START_POSITION_TILE_GRID > 1500`);
      }
    } catch (e) {

    }
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

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}