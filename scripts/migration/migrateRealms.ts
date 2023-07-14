/* global ethers hre */

import { ethers } from "hardhat";
import { MigrationFacet } from "../../typechain-types";

const realmDiamondAddressGotchichain = process.env.AAVEGOTCHI_DIAMOND_ADDRESS_MUMBAI as string

export default async function main() {
  const migrationFacet: MigrationFacet = await ethers.getContractAt("MigrationFacet", realmDiamondAddressGotchichain)



  const migrateParcel = async (parcel: Parcel) => {
    const simpleParcel = createSimpleParcel(parcel)
    migrationFacet.migrateParcel(parcel.id, simpleParcel, [], [], [], [])
  }
}

const createSimpleParcel = (parcel: Parcel): MigrationFacet.SimpleParcelStruct => {
  return {
    owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    parcelAddress: "test",
    parcelId: "test",
    coordinateX: "5",
    coordinateY: "5",
    district: "2",
    size: "2",
    alchemicaBoost: ["1", "1", "1", "1"],
    alchemicaRemaining: ["1", "1", "1", "1"],
    currentRound: "1",
    alchemicaHarvestRate: ["1", "1", "1", "1"],
    lastUpdateTimestamp: ["1", "1", "1", "1"],
    unclaimedAlchemica: ["1", "1", "1", "1"],
    altarId: "1",
    upgradeQueueCapacity: "1",
    upgradeQueueLength: "1",
    lodgeId: "1",
    surveying: true,
    harvesterCount: "1",
  }
}

interface Parcel {
  id: string
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
