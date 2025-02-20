import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { varsForNetwork } from "../constants";
import { RealmGettersAndSettersFacet } from "../typechain-types";
import { countInstallationOccurrences } from "../data/installations/allInstallations";
import { countTileOccurrences } from "../data/tiles/tileTypes";

import fs from "fs";
import { vault } from "./getInstallationAndTileData";

export const PARCELS_FILE = `${__dirname}/cloneData/parcels.json`;

//normal contract holders
export const PARCELS_CONTRACTS_FILE = `${__dirname}/cloneData/parcels-contractHolders.json`;

//parcels in vault
export const PARCELS_VAULT_FILE = `${__dirname}/cloneData/parcels-vault.json`;

const PROCESSED_REALMS_FILE = `${__dirname}/cloneData/processed-parcels.json`;

interface BounceGate {
  title: string;
  startTime: BigNumber;
  endTime: BigNumber;
  priority: BigNumber;
  equipped: boolean;
  lastTimeUpdated: BigNumber;
}

interface Installations {
  id: number;
  amount: number;
}

interface Tiles {
  id: number;
  amount: number;
}

export interface ParcelIO {
  owner: string;
  parcelAddress: string;
  parcelId: string;
  coordinateX: BigNumber;
  coordinateY: BigNumber;
  district: BigNumber;
  size: BigNumber;
  alchemicaBoost: [BigNumber, BigNumber, BigNumber, BigNumber];
  alchemicaRemaining: [BigNumber, BigNumber, BigNumber, BigNumber];
  currentRound: BigNumber;
  roundBaseAlchemica: BigNumber[][];
  roundAlchemica: BigNumber[][];
  reservoirs: [BigNumber[], BigNumber[], BigNumber[], BigNumber[]];
  alchemicaHarvestRate: [BigNumber, BigNumber, BigNumber, BigNumber];
  lastUpdateTimestamp: [BigNumber, BigNumber, BigNumber, BigNumber];
  unclaimedAlchemica: [BigNumber, BigNumber, BigNumber, BigNumber];
  altarId: BigNumber;
  upgradeQueueCapacity: BigNumber;
  upgradeQueueLength: BigNumber;
  lodgeId: BigNumber;
  surveying: boolean;
  harvesterCount: number;
  gate: BounceGate;
  buildGrid: number[][];
  tileGrid: number[][];
  startPositionBuildGrid: number[][];
  startPositionTileGrid: number[][];
  installations: Installations[];
  tiles: Tiles[];
  buildWrite: boolean;
  tileWrite: boolean;
}

async function getParcelIds() {
  const apollo = require("apollo-fetch");
  const uri =
    "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-matic/api";
  const graph = apollo.createApolloFetch({
    uri,
  });
  const first = 5000;
  let allParcelIds = [];
  let lastId = 0;
  let hasMore = true;

  while (hasMore) {
    let query = `{
      parcels(
        first: ${first}
        where: {
          tokenId_gt: "${lastId}",
          owner_not_in: [
            "0x0000000000000000000000000000000000000000",
            "0x000000000000000000000000000000000000dEaD"
          ]
        }
        orderBy: tokenId
        orderDirection: asc
      ) {
        id
      }
    }`;

    const response = await graph({ query });
    const parcels = response.data.parcels;

    if (parcels.length === 0) {
      hasMore = false;
    } else {
      allParcelIds = allParcelIds.concat(parcels.map((parcel) => parcel.id));
      lastId = Number(parcels[parcels.length - 1].id);
      console.log(
        `Fetched ${parcels.length} parcels. Total: ${allParcelIds.length}`
      );
    }
  }

  return allParcelIds;
}
//we use the latest block generally after diamond is frozen
// const block = 66408531;

async function main() {
  const c = await varsForNetwork(ethers);

  const allRealmIds = await getParcelIds();
  const realmIds = allRealmIds.slice(0, 200); // Only get first 100 parcels

  const realmGetterAndSetterFacet = (await ethers.getContractAt(
    "RealmGettersAndSettersFacet",
    c.realmDiamond
  )) as RealmGettersAndSettersFacet;

  let existingData = {};

  let existingDataContracts = {};
  let existingDataVault = {};

  //first check if dir exists
  const dir = `${__dirname}/cloneData`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  //if parcels.json doesn't exist, create it
  if (!fs.existsSync(PARCELS_FILE)) {
    fs.writeFileSync(PARCELS_FILE, "{}", "utf8");
  }

  //if parcels-contractHolders.json doesn't exist, create it
  if (!fs.existsSync(PARCELS_CONTRACTS_FILE)) {
    fs.writeFileSync(PARCELS_CONTRACTS_FILE, "{}", "utf8");
  }

  //if parcels-vault.json doesn't exist, create it
  if (!fs.existsSync(PARCELS_VAULT_FILE)) {
    fs.writeFileSync(PARCELS_VAULT_FILE, "{}", "utf8");
  }

  const fileContent = await fs.readFileSync(PARCELS_FILE, "utf8");
  existingData = JSON.parse(fileContent);

  for (const realmId of realmIds) {
    const parcelData = await realmGetterAndSetterFacet.getParcelData(realmId);
    const parcelGrid = await realmGetterAndSetterFacet.getParcelGrids(realmId);
    const parcelIO = populateParcelIO(parcelData, parcelGrid);

    //check if owner is vault
    if (parcelData.owner.toLowerCase() === vault.toLowerCase()) {
      existingDataVault[realmId.toString()] = parcelIO;
    } else {
      const code = await ethers.provider.getCode(parcelData.owner);
      if (code !== "0x") {
        existingDataContracts[realmId.toString()] = parcelIO;
      } else {
        existingData[realmId.toString()] = parcelIO;
      }
    }

    console.log(`Processed parcel ${realmId}`);
  }

  await fs.writeFileSync(
    PARCELS_FILE,
    JSON.stringify(existingData, null, 2),
    "utf8"
  );
  await fs.writeFileSync(
    PROCESSED_REALMS_FILE,
    JSON.stringify(realmIds, null, 2),
    "utf8"
  );

  await fs.writeFileSync(
    PARCELS_CONTRACTS_FILE,
    JSON.stringify(existingDataContracts, null, 2),
    "utf8"
  );
  await fs.writeFileSync(
    PARCELS_VAULT_FILE,
    JSON.stringify(existingDataVault, null, 2),
    "utf8"
  );
  console.log(
    `Updated data for ${realmIds.length} parcels in parcels.json and processed-realms.json`
  );
}

function populateParcelIO(
  parcelData,
  parcelGrid: {
    buildGrid_: BigNumber[][];
    tileGrid_: BigNumber[][];
    startPositionBuildGrid_: BigNumber[][];
    startPositionTileGrid_: BigNumber[][];
  }
): ParcelIO {
  const convertGrid = (grid: BigNumber[][]) =>
    grid.map((row) => row.map((val) => val.toNumber()));
  const buildGrid = convertGrid(parcelGrid.buildGrid_);
  const tileGrid = convertGrid(parcelGrid.tileGrid_);

  return {
    owner: parcelData.owner,
    parcelAddress: parcelData.parcelAddress,
    parcelId: parcelData.parcelId,
    coordinateX: parcelData.coordinateX,
    coordinateY: parcelData.coordinateY,
    district: parcelData.district,
    size: parcelData.size,
    alchemicaBoost: parcelData.alchemicaBoost,
    alchemicaRemaining: parcelData.alchemicaRemaining,
    currentRound: parcelData.currentRound,
    roundBaseAlchemica: parcelData.roundBaseAlchemica,
    roundAlchemica: parcelData.roundAlchemica,
    reservoirs: parcelData.reservoirs,
    alchemicaHarvestRate: parcelData.alchemicaHarvestRate,
    lastUpdateTimestamp: parcelData.lastUpdateTimestamp,
    unclaimedAlchemica: parcelData.unclaimedAlchemica,
    altarId: parcelData.altarId,
    upgradeQueueCapacity: parcelData.upgradeQueueCapacity,
    upgradeQueueLength: parcelData.upgradeQueueLength,
    lodgeId: parcelData.lodgeId,
    surveying: parcelData.surveying,
    harvesterCount: parcelData.harvesterCount,
    gate: parcelData.gate,
    buildGrid,
    tileGrid,
    startPositionBuildGrid: convertGrid(parcelGrid.startPositionBuildGrid_),
    startPositionTileGrid: convertGrid(parcelGrid.startPositionTileGrid_),
    installations: countInstallationOccurrences(buildGrid),
    tiles: countTileOccurrences(tileGrid),
    buildWrite: countInstallationOccurrences(buildGrid).length > 0,
    tileWrite: countTileOccurrences(tileGrid).length > 0,
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
