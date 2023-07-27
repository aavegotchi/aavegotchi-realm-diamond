/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

// const realmDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const realmDiamondAddress = '0x5258fCe3bE52b399AE210D875AD70BC2e3A55aD1'

const BATCH_SIZE = 60

export default async function main() {
  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmDiamondAddress)

  const parcels: any[] = (await readAllParcels()).slice(0, 100)
  let promises = [];

  for (let i = 0; i < parcels.length; i++) {
    if (promises.length == BATCH_SIZE) {
      console.log()
      await Promise.allSettled(promises);
      promises = [];
    }

    let parcel = parcels[i];
    fillParcelData(parcel);

    promises.push(
      (async () => {
        try {
          console.log(`Verifying parcel with ID ${parcel.tokenId}`)
          const migratedParcel = await gettersAndSettersFacet.getParcel(parcel.tokenId)
          
          let message = `\nMigration gone wrong for parcel with ${parcel.tokenId}\n`
          let migrationGoneWrong = false
          if (parcel.owner.toLowerCase() !== migratedParcel.owner.toLowerCase()) {
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
          if (parcel.coordinateX !== migratedParcel.coordinateX.toString()) {
            migrationGoneWrong = true
            message += `Incorrect coordinateX, expected ${parcel.coordinateX}, got ${migratedParcel.coordinateX.toString()}\n`
          }
          if (parcel.coordinateY !== migratedParcel.coordinateY.toString()) {
            migrationGoneWrong = true
            message += `Incorrect coordinateY, expected ${parcel.coordinateY.hex}, got ${migratedParcel.coordinateY.toString()}\n`
          }
          if (parcel.district !== migratedParcel.district.toString()) {
            migrationGoneWrong = true
            message += `Incorrect district, expected ${parcel.district.hex}, got ${migratedParcel.district.toString()}\n`
          }
          if (parcel.size !== migratedParcel.size.toString()) {
            migrationGoneWrong = true
            message += `Incorrect size, expected ${parcel.size.hex}, got ${migratedParcel.size.toString()}\n`
          }

          let alchemicaBoostMigrationGoneWrong = false
          let alchemicaRemainingMigrationGoneWrong = false
          for (let i = 0; i < 4; i++) {
            if (parcel.alchemicaBoost[i] !== migratedParcel.alchemicaBoost[i].toString())
              alchemicaBoostMigrationGoneWrong = true
            if (parcel.alchemicaRemaining[i] !== migratedParcel.alchemicaRemaining[i].toString())
              alchemicaRemainingMigrationGoneWrong = true
          }

          if (alchemicaBoostMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect alchemicaBoost\n`
          }
          if (alchemicaRemainingMigrationGoneWrong) {
            migrationGoneWrong = true
            message += `Incorrect alchemicaRemaining\n`
          }

          if (migrationGoneWrong) {
            console.log(message)
            fs.appendFileSync('empty-parcels-migration-errors.txt', `${message}\n`);
          }
        } catch (e) {
          console.log(e.message);
        }
      })()
    );
  }

  console.log("Settling")
  await Promise.allSettled(promises);
  promises = [];
}

const readAllParcels = async () => {
  const rawParcelsData = fs.readFileSync(`emptyParcels.json`)
  const parcel = JSON.parse(rawParcelsData)
  return parcel
}

function fillParcelData(parcel: MigrationFacet.ParcelDataStruct) {
  if (!parcel.currentRound) parcel.currentRound = BigNumber.from(0);
  if (!parcel.alchemicaHarvestRate) parcel.alchemicaHarvestRate = ['0', '0', '0', '0'];
  if (!parcel.lastUpdateTimestamp) parcel.lastUpdateTimestamp = ['0', '0', '0', '0'];
  if (!parcel.unclaimedAlchemica) parcel.unclaimedAlchemica = ['0', '0', '0', '0'];
  if (!parcel.altarId) parcel.altarId = BigNumber.from(0);
  if (!parcel.upgradeQueueCapacity) parcel.upgradeQueueCapacity = BigNumber.from(0);
  if (!parcel.upgradeQueueLength) parcel.upgradeQueueLength = BigNumber.from(0);
  if (!parcel.lodgeId) parcel.lodgeId = BigNumber.from("0");
  if (!parcel.harvesterCount) parcel.harvesterCount = BigNumber.from(0);

  parcel.buildGrid = [];
  parcel.tileGrid = [];
  parcel.startPositionBuildGrid = [];
  parcel.startPositionTileGrid = [];

  if (!parcel.roundBaseAlchemica) parcel.roundBaseAlchemica = [];
  if (!parcel.roundAlchemica) parcel.roundAlchemica = [];
  if (!parcel.reservoirs) parcel.reservoirs = [];
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
