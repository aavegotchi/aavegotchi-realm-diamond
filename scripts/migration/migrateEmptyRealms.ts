/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet, RealmGettersAndSettersFacet } from "../../typechain-types";
import { deploy } from "../deployAll";
import { BigNumber } from "ethers";

const fs = require("fs");

// const realmDiamondAddress = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string
const realmsBrigeAddress = process.env.REALMS_BRIDGE_ADDRESS_GOTCHICHAIN as string
const realmsDiamondAddressGotchichain = process.env.REALMS_DIAMOND_ADDRESS_GOTCHICHAIN as string
const BATCH_SIZE = 60
const gasPrice = 0

export default async function main() {

  const signerAddress = await ethers.provider.getSigner().getAddress();
  const migrationFacet: MigrationFacet = await ethers.getContractAt("MigrationFacet", realmsDiamondAddressGotchichain)
  const gettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmsDiamondAddressGotchichain)

  let txCounter = (await ethers.provider.getTransactionCount(signerAddress, "latest"));

  let parcels: any[] = await readAllParcels()

  let promises = [];

  for (let i = 0; i < parcels.length; i++) {
    if (promises.length == BATCH_SIZE) {
      console.log('Waiting txs to settle')
      await Promise.allSettled(promises);
      console.log('Txs settled')
      promises = [];
    }

    let parcel = parcels[i];
    fillParcelData(parcel);

    if ((await gettersAndSettersFacet.getParcel(parcel.tokenId)).owner !== '0x0000000000000000000000000000000000000000') continue

    promises.push(
      (async () => {
        try {
          const nonce = txCounter
          console.log(`Migrating parcel with ID ${parcel.tokenId} at position ${i} with nonce ${nonce}`)
          const tx = await migrationFacet.migrateParcel(parcel.tokenId, parcel, { nonce, gasPrice })
          await tx.wait()
          console.log(`Migrated parcel with ID ${parcel.tokenId}\n`);
        } catch (e) {
          console.log(e);
        }
      })()
    );
    txCounter++;
  }

  console.log("Settling")
  await Promise.allSettled(promises);
  console.log("Settled")
  promises = [];
}

const readAllParcels = async () => {
  const rawParcelsData = fs.readFileSync(`emptyParcels.json`)
  const parcel = JSON.parse(rawParcelsData)
  return parcel
}

function fillParcelData(parcel: MigrationFacet.ParcelDataStruct) {
  parcel.owner = realmsBrigeAddress
  
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
