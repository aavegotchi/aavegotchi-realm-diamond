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
  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmDiamondAddress)

  const transactionCount = await ethers.provider.getTransactionCount(signerAddress, "latest");

  const parcelIds = readParcelIds()
  let promises = [];

  let aditionalTxCounter = 0
  // for (let i = 0; i < parcelIds.length; i++) {
  const parcelId = 6204//parcelIds[i].tokenId
  for (let i = 0; i < 1; i++) {
    if (promises.length >= BATCH_SIZE) {
      await Promise.allSettled(promises);
      promises = [];
    }

    const parcelId = 6204//parcelIds[i].tokenId
    let parcel = await readParcel(parcelId);

    const allGridsLength = parcel.buildGrid.length +
      parcel.tileGrid.length +
      parcel.startPositionBuildGrid.length +
      parcel.startPositionTileGrid.length

    if (allGridsLength > 1500) {
      console.log("Sending 1")
      promises.push(
        (async () => {
          try {
            console.log("nonce", transactionCount + i + aditionalTxCounter)
            await migrationFacet.migrateParcel(
              parcelId,
              {
                ...parcel,
                buildGrid: [],
                tileGrid: [],
                startPositionBuildGrid: [],
                startPositionTileGrid: []
              },
              {
                // nonce: transactionCount + i + aditionalTxCounter,
                gasLimit: 20000000
              }
            )
          } catch (e) {
            console.log(e)
          }
        })()
      )
      aditionalTxCounter++

      if (parcel.buildGrid.length > 1500) {
        while (parcel.buildGrid.length > 0) {
          const chunk = parcel.buildGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = transactionCount + i + aditionalTxCounter
                const tx = await migrationFacet.saveBuildGrid(
                  parcelId,
                  chunk,
                  {
                    // nonce,
                    gasLimit: 20000000
                  }
                )
                await tx.wait()
              } catch (e) {
                console.log(e)
              }
            })()
          )
          aditionalTxCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              const nonce = transactionCount + i + aditionalTxCounter
              await migrationFacet.saveBuildGrid(
                parcelId,
                parcel.buildGrid,
                {
                  // nonce,
                  gasLimit: 20000000
                }
              )
            } catch (e) {
              console.log(e)
            }
          })()
        )
        aditionalTxCounter++
        console.log(aditionalTxCounter)
      }

      if (parcel.tileGrid.length > 1500) {
        while (parcel.tileGrid.length > 0) {
          const chunk = parcel.tileGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = transactionCount + i + aditionalTxCounter
                const tx = await migrationFacet.saveTileGrid(
                  parcelId,
                  chunk,
                  {
                    // nonce,
                    gasLimit: 20000000
                  }
                )
                await tx.wait()
              } catch (e) {
                console.log(e)
              }
            })()
          )
          aditionalTxCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              await migrationFacet.saveTileGrid(
                parcelId,
                parcel.tileGrid,
                {
                  // nonce: transactionCount + i + aditionalTxCounter,
                  gasLimit: 20000000
                }
              )
            } catch (e) {
              console.log(e)
            }
          })()
        )
        aditionalTxCounter++
      }

      if (parcel.startPositionBuildGrid.length > 1500) {
        while (parcel.startPositionBuildGrid.length > 0) {
          const chunk = parcel.startPositionBuildGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = transactionCount + i + aditionalTxCounter
                const tx = await migrationFacet.saveStartPositionBuildGrid(
                  parcelId,
                  chunk,
                  {
                    // nonce,
                    gasLimit: 20000000
                  }
                )
                await tx.wait()
              } catch (e) {
                console.log(e)
              }
            })()
          )
          aditionalTxCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              await migrationFacet.saveStartPositionBuildGrid(
                parcelId,
                parcel.startPositionBuildGrid,
                {
                  // nonce: transactionCount + i + aditionalTxCounter,
                  gasLimit: 20000000
                }
              )
            } catch (e) {
              console.log(e)
            }
          })()
        )
        aditionalTxCounter++
      }

      if (parcel.startPositionTileGrid.length > 1500) {
        while (parcel.startPositionTileGrid.length > 0) {
          const chunk = parcel.startPositionTileGrid.splice(0, 1500)
          promises.push(
            (async () => {
              try {
                const nonce = transactionCount + i + aditionalTxCounter
                const tx = await migrationFacet.saveStartPositionTileGrid(
                  parcelId,
                  chunk,
                  {
                    // nonce,
                    gasLimit: 20000000
                  }
                )
                await tx.wait()
              } catch (e) {
                console.log(e)
              }
            })()
          )
          aditionalTxCounter++
        }
      } else {
        promises.push(
          (async () => {
            try {
              await migrationFacet.saveStartPositionTileGrid(
                parcelId,
                parcel.startPositionTileGrid,
                {
                  // nonce: transactionCount + i + aditionalTxCounter,
                  gasLimit: 20000000
                }
              )
            } catch (e) {
              console.log(e)
            }
          })()
        )
        aditionalTxCounter++
      }
    } else {
      promises.push(
        (async () => {
          try {
            console.log(`\nReading parcel with ID ${parcelId}`)

            const nonce = transactionCount + i + aditionalTxCounter
            await migrationFacet.migrateParcel(parcelId, parcel, { nonce, gasLimit: 20000000 })
            console.log(`Migrated parcel with ID ${parcelId}`);

            console.log(`Saving migrated parcel to non-empty-migrated-parcels.txt`)
            // fs.appendFileSync('non-empty-migrated-parcels.txt', `${parcelId}\n`);
            console.log(`Saved migrated parcel to non-empty-migrated-parcels.txt`)
          } catch (e) {
            // console.log('\n')
            // console.log(e.message);

            console.log(`Logging migrating error to error-non-empty-migrated-parcels.txt`)
            // fs.appendFileSync('error-non-empty-migrated-parcels.txt', `${parcelId}\n`);
            console.log(`Logged migration error to error-non-empty-migrated-parcels.txt`)
          }
        })()
      );
    }
  }

  console.log("Settling")
  await Promise.allSettled(promises);
  console.log("Settled")
  promises = [];

  const rParcel = await gettersAndSettersFacet.getParcel(parcelId)
  console.log(rParcel.size)

  console.log("\nResult Parcel")
  console.log(rParcel.reservoirs)
}

const readParcelIds = () => {
  const rawParcelData = fs.readFileSync(`nonEmptyParcelIds.json`)
  const parcel = JSON.parse(rawParcelData)
  return parcel
}

const readParcel = (parcelId: string | number) => {
  const rawParcelData = fs.readFileSync(`parcels/parcel-${parcelId}.json`)
  const parcel = JSON.parse(rawParcelData)

  console.log("\nRead Parcel")
  console.log(parcel.reservoirs)

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
