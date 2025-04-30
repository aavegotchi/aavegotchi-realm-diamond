import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { RealmGettersAndSettersFacet } from "../../typechain-types";
import { countInstallationOccurrences } from "../../data/installations/allInstallations";
import { countTileOccurrences } from "../../data/tiles/tileTypes";
import fs from "fs";
import path from "path";

// File paths configuration
const DATA_DIR = path.join(__dirname, "cloneData", "parcel", "metadata");
const PROCESSED_REALMS_FILE = path.join(DATA_DIR, "processed-parcels.json");

// Interfaces
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

// Utility functions
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content ? JSON.parse(content) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    throw error;
  }
}

// GraphQL query function
export async function getParcelIds(): Promise<string[]> {
  const apollo = require("apollo-fetch");
  const uri = process.env.GOTCHIVERSE_URI;
  const graph = apollo.createApolloFetch({ uri });
  const first = 5000;
  let allParcelIds: string[] = [];
  let lastId = 0;
  let hasMore = true;

  while (hasMore) {
    const query = `{
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

    try {
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
    } catch (error) {
      console.error(`Error fetching parcels:`, error);
      hasMore = false;
    }
  }

  return allParcelIds;
}

// Process single parcel
async function processParcel(
  realmId: string,
  realmGetterAndSettersFacet: RealmGettersAndSettersFacet,
  currentFileIndex: number
): Promise<{ success: boolean; newFileIndex: number }> {
  try {
    const parcelData = await realmGetterAndSettersFacet.getParcelData(realmId);
    const parcelGrid = await realmGetterAndSettersFacet.getParcelGrids(realmId);
    const data = populateParcelIO(parcelData, parcelGrid);

    let fileIndex = currentFileIndex;
    let writeSuccess = false;

    while (!writeSuccess) {
      const targetFile = path.join(DATA_DIR, `parcels${fileIndex}.json`);
      try {
        const existingData = readJsonFile<Record<string, ParcelIO>>(
          targetFile,
          {}
        );
        existingData[realmId] = data;
        await writeJsonFile(targetFile, existingData);
        writeSuccess = true;
      } catch (error) {
        if (error.message.includes("Invalid string length")) {
          console.log(
            `File parcels${fileIndex}.json is full, trying next file...`
          );
          fileIndex++;
        } else {
          throw error;
        }
      }
    }

    // Update processed parcels list
    const processedParcels = readJsonFile<string[]>(PROCESSED_REALMS_FILE, []);
    if (!processedParcels.includes(realmId)) {
      processedParcels.push(realmId);
      await writeJsonFile(PROCESSED_REALMS_FILE, processedParcels);
    }

    return { success: true, newFileIndex: fileIndex };
  } catch (error) {
    console.error(`Error processing parcel ${realmId}:`, error);
    return { success: false, newFileIndex: currentFileIndex };
  }
}

// Convert parcel data to ParcelIO format
function populateParcelIO(
  parcelData: any,
  parcelGrid: {
    buildGrid_: BigNumber[][];
    tileGrid_: BigNumber[][];
    startPositionBuildGrid_: BigNumber[][];
    startPositionTileGrid_: BigNumber[][];
  }
): ParcelIO {
  const convertGrid = (grid: BigNumber[][]) =>
    grid.map((row) => row.map((val) => val.toNumber()));

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
    buildGrid: convertGrid(parcelGrid.buildGrid_),
    tileGrid: convertGrid(parcelGrid.tileGrid_),
    startPositionBuildGrid: convertGrid(parcelGrid.startPositionBuildGrid_),
    startPositionTileGrid: convertGrid(parcelGrid.startPositionTileGrid_),
    installations: countInstallationOccurrences(
      convertGrid(parcelGrid.buildGrid_)
    ),
    tiles: countTileOccurrences(convertGrid(parcelGrid.tileGrid_)),
    buildWrite:
      countInstallationOccurrences(convertGrid(parcelGrid.buildGrid_)).length >
      0,
    tileWrite:
      countTileOccurrences(convertGrid(parcelGrid.tileGrid_)).length > 0,
  };
}

// Find current highest file index
function findCurrentFileIndex(): number {
  const files = fs.readdirSync(DATA_DIR);
  let maxIndex = 1;

  files.forEach((file) => {
    const match = file.match(/^parcels(\d+)\.json$/);
    if (match) {
      const index = parseInt(match[1]);
      maxIndex = Math.max(maxIndex, index);
    }
  });

  return maxIndex;
}

async function main() {
  try {
    ensureDirectoryExists(DATA_DIR);

    // Get all parcel IDs
    const allRealmIds = await getParcelIds();
    console.log(`Total parcels to process: ${allRealmIds.length}`);

    // Get already processed parcels
    const processedParcels = new Set(
      readJsonFile<string[]>(PROCESSED_REALMS_FILE, [])
    );
    console.log(`Already processed: ${processedParcels.size} parcels`);

    // Setup contract
    const c = await varsForNetwork(ethers);
    const realmGettersAndSettersFacet = await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      c.realmDiamond
    );

    let currentFileIndex = findCurrentFileIndex();
    let consecutiveErrors = 0;

    // Process parcels
    for (const realmId of allRealmIds) {
      if (processedParcels.has(realmId)) {
        continue;
      }

      console.log(`Processing parcel ${realmId}...`);
      const { success, newFileIndex } = await processParcel(
        realmId,
        realmGettersAndSettersFacet,
        currentFileIndex
      );

      if (success) {
        currentFileIndex = newFileIndex;
        consecutiveErrors = 0;
        console.log(
          `Successfully processed parcel ${realmId} to file parcels${currentFileIndex}.json`
        );
      } else {
        consecutiveErrors++;
        if (consecutiveErrors >= 5) {
          console.log("Too many consecutive errors, waiting 30 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 30000));
          consecutiveErrors = 0;
        }
      }
    }

    console.log("Finished processing all parcels!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
