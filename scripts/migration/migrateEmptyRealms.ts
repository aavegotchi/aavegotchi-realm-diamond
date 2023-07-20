/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

const realmDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

const BATCH_SIZE = 200

export default async function main() {
  const realmDiamondAddress = await deployRealmDiamond()

  const signerAddress = await ethers.provider.getSigner().getAddress();
  const migrationFacet: MigrationFacet = await ethers.getContractAt("MigrationFacet", realmDiamondAddress)

  const parcels: any[] = await readAllParcels()
  let promises = [];

  const transactionCount = await ethers.provider.getTransactionCount(
    signerAddress,
    "latest"
  );

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
          const nonce = transactionCount + i
          await migrationFacet.migrateParcel(parcel.tokenId, parcel, { nonce })
          console.log(`\nMigrated parcel with ID ${parcel.tokenId}`);

          console.log(`Saving migrated parcel to empty-migrated-parcels.txt`)
          fs.appendFileSync('empty-migrated-parcels.txt', `${parcel.tokenId}\n`);
          console.log(`Saved migrated parcel to empty-migrated-parcels.txt`)
        } catch (e) {
          console.log(e.message);

          console.log(`Logging error on migrating parcel to error-empty-migrated-parcels.txt`)
          fs.appendFileSync('error-empty-migrated-parcels.txt', `${parcel.tokenId}\n`);
          console.log(`Logging error on migrating to error-empty-migrated-parcels.txt`)
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
