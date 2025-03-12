import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { varsForNetwork } from "../constants";
import { RealmGettersAndSettersFacet } from "../typechain-types";
import { countInstallationOccurrences } from "../data/installations/allInstallations";
import { countTileOccurrences } from "../data/tiles/tileTypes";
import { isSafe } from "./getInstallationAndTileData";
import { SafeDetails } from "./getInstallationAndTileData";
import fs from "fs";
import path from "path";
import {
  vault,
  gbmDiamond,
  rafflesContract,
  getOwner,
} from "./getInstallationAndTileData";

// File paths configuration
const DATA_DIR = path.join(__dirname, "cloneData", "parcel", "metadata");
export const PARCELS_FILE = path.join(DATA_DIR, "parcels1.json");
export const PARCELS_CONTRACTS_FILE = path.join(
  DATA_DIR,
  "parcels-contractHolders.json"
);
export const PARCELS_VAULT_FILE = path.join(DATA_DIR, "parcels-vault.json");
export const PARCELS_GBM_FILE = path.join(DATA_DIR, "parcels-gbm.json");
export const PARCELS_RAFFLES_FILE = path.join(DATA_DIR, "parcels-raffles.json");
export const PARCELS_CONTRACTS_WITH_OWNER_FILE = path.join(
  DATA_DIR,
  "parcels-contractsWithOwner.json"
);
export const PARCELS_IN_SAFE_FILE = path.join(DATA_DIR, "parcels-safe.json");
const PROCESSED_REALMS_FILE = path.join(DATA_DIR, "processed-parcels.json");

// Configuration constants
const MAX_RETRIES = 3;
const MAX_PARCELS = 0; // Maximum number of parcels to process, set to 0 for no limit
const BATCH_SIZE = 10; // Number of parcels to process before saving processed list
const MAX_CONSECUTIVE_ERRORS = 5;
const RESTART_DELAY = 30000; // 30 seconds

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

interface ParcelWithOwner {
  contractOwner: string;
  parcel: ParcelIO;
}

// Add these interfaces for analytics
interface ParcelAnalytics {
  gnosisSafeParcels: Set<string>;
  normalAddressParcels: Set<string>;
  gbmParcels: Set<string>;
  vaultParcels: Set<string>;
  rafflesParcels: Set<string>;
  contractsWithOwnerParcels: Set<string>;
  unknownContractParcels: Set<string>;

  // Track unique holders
  uniqueNormalHolders: Set<string>;
  uniqueContractsWithOwners: Set<string>;
  uniqueContractsWithoutOwners: Set<string>;
  uniqueGnosisSafes: Set<string>;
}

// Utility functions for file operations
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) {
    console.warn(`File does not exist: ${filePath}`);
    return defaultValue;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    if (!content) {
      console.warn(`File is empty: ${filePath}`);
      return defaultValue;
    }
    const parsed = JSON.parse(content);

    // Type validation
    if (
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue) &&
      (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    ) {
      console.warn(`File ${filePath} has incorrect format. Expected object.`);
      return defaultValue;
    }

    return parsed as T; // Return the parsed object directly
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return defaultValue;
  }
}

// Update the writeJsonFile function to handle both streaming and batch operations
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    // Convert data to JSON string with proper formatting
    const jsonString = JSON.stringify(data, null, 2);

    // Write to the file (this will create the file if it doesn't exist)
    fs.writeFileSync(filePath, jsonString); // Synchronous write for simplicity
  } catch (error) {
    console.error(`Error writing to ${filePath}: ${error.message}`);
    throw error; // Rethrow the error for further handling
  }
}

// GraphQL query function
async function getParcelIds(): Promise<string[]> {
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
      console.error(`Error fetching parcels: ${error.message}`);
      // Retry logic could be added here
      hasMore = false;
    }
  }

  return allParcelIds;
}

// Add this function to display analytics
function displayAnalytics(analytics: ParcelAnalytics) {
  console.log("\n=== Parcel Distribution Analytics ===");
  console.log("\nParcel Counts:");
  console.log(`Parcels in Gnosis Safes: ${analytics.gnosisSafeParcels.size}`);
  console.log(
    `Parcels held by normal addresses: ${analytics.normalAddressParcels.size}`
  );
  console.log(`Parcels in GBM: ${analytics.gbmParcels.size}`);
  console.log(`Parcels in Vault: ${analytics.vaultParcels.size}`);
  console.log(`Parcels in Raffles: ${analytics.rafflesParcels.size}`);
  console.log(
    `Parcels in contracts with known owners: ${analytics.contractsWithOwnerParcels.size}`
  );
  console.log(
    `Parcels in unknown contracts: ${analytics.unknownContractParcels.size}`
  );

  console.log("\nUnique Holder Counts:");
  console.log(
    `Unique normal address holders: ${analytics.uniqueNormalHolders.size}`
  );
  console.log(
    `Unique contracts with owners: ${analytics.uniqueContractsWithOwners.size}`
  );
  console.log(
    `Unique contracts without owners: ${analytics.uniqueContractsWithoutOwners.size}`
  );
  console.log(`Unique Gnosis Safes: ${analytics.uniqueGnosisSafes.size}`);

  const totalParcels =
    analytics.gnosisSafeParcels.size +
    analytics.normalAddressParcels.size +
    analytics.gbmParcels.size +
    analytics.vaultParcels.size +
    analytics.rafflesParcels.size +
    analytics.contractsWithOwnerParcels.size +
    analytics.unknownContractParcels.size;

  const totalUniqueHolders =
    analytics.uniqueNormalHolders.size +
    analytics.uniqueContractsWithOwners.size +
    analytics.uniqueContractsWithoutOwners.size +
    analytics.uniqueGnosisSafes.size;

  console.log(`\nTotal parcels: ${totalParcels}`);
  console.log(`Total unique holders: ${totalUniqueHolders}`);
}

// Add this function to find the highest numbered parcels file
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

  console.log(`Found highest parcels file index: ${maxIndex}`);
  return maxIndex;
}

// Update the initialization
let currentFileIndex = findCurrentFileIndex(); // Initialize with actual current index

// Modify the processParcel function to use the correct path for new files
async function processParcel(
  realmId: string,
  realmGetterAndSettersFacet: RealmGettersAndSettersFacet,
  analytics: ParcelAnalytics
): Promise<boolean> {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const parcelData = await realmGetterAndSettersFacet.getParcelData(
        realmId
      );
      const parcelGrid = await realmGetterAndSettersFacet.getParcelGrids(
        realmId
      );
      const data = populateParcelIO(parcelData, parcelGrid);

      const owner = data.owner.toLowerCase();
      let targetFile = path.join(DATA_DIR, `parcels${currentFileIndex}.json`);
      let writeSuccess = false;

      try {
        // Handle special cases first
        if (owner === vault.toLowerCase()) {
          targetFile = PARCELS_VAULT_FILE;
          analytics.vaultParcels.add(realmId);
        } else if (owner === gbmDiamond.toLowerCase()) {
          targetFile = PARCELS_GBM_FILE;
          analytics.gbmParcels.add(realmId);
        } else if (owner === rafflesContract.toLowerCase()) {
          targetFile = PARCELS_RAFFLES_FILE;
          analytics.rafflesParcels.add(realmId);
        } else if (await isSafe(owner)) {
          targetFile = PARCELS_IN_SAFE_FILE;
          analytics.gnosisSafeParcels.add(realmId);
          analytics.uniqueGnosisSafes.add(owner);
        } else if (owner.length === 42 && /^0x[0-9a-fA-F]{40}$/.test(owner)) {
          const code = await ethers.provider.getCode(owner);
          if (code !== "0x") {
            // It's a contract
            const contractOwner = await getOwner(owner);
            if (contractOwner) {
              targetFile = PARCELS_CONTRACTS_WITH_OWNER_FILE;
              analytics.contractsWithOwnerParcels.add(realmId);
              analytics.uniqueContractsWithOwners.add(owner);
            } else {
              targetFile = PARCELS_CONTRACTS_FILE;
              analytics.unknownContractParcels.add(realmId);
              analytics.uniqueContractsWithoutOwners.add(owner);
            }
          } else {
            // For normal addresses, try writing to different files until successful
            let fileIndex = currentFileIndex; // Start from current index instead of 1
            while (!writeSuccess) {
              targetFile = path.join(DATA_DIR, `parcels${fileIndex}.json`);
              try {
                const existingData = readJsonFile<Record<string, ParcelIO>>(
                  targetFile,
                  {}
                );
                existingData[realmId] = data;
                await writeJsonFile(targetFile, existingData);
                writeSuccess = true;
                currentFileIndex = fileIndex;
                analytics.normalAddressParcels.add(realmId);
                analytics.uniqueNormalHolders.add(owner);
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
          }
        }

        // If it's not a normal address (special case), write to the target file
        if (!writeSuccess) {
          const existingData = readJsonFile<Record<string, ParcelIO>>(
            targetFile,
            {}
          );
          existingData[realmId] = data;
          await writeJsonFile(targetFile, existingData);
          writeSuccess = true;
        }

        // Only update processed-parcels.json if write was successful
        if (writeSuccess) {
          const processedParcels = readJsonFile<string[]>(
            PROCESSED_REALMS_FILE,
            []
          );
          if (!processedParcels.includes(realmId)) {
            processedParcels.push(realmId);
            await writeJsonFile(PROCESSED_REALMS_FILE, processedParcels);
            console.log(`Added parcel ${realmId} to processed-parcels.json`);
          }
          return true;
        }
      } catch (error) {
        console.error(`Error writing parcel ${realmId} data:`, error);
        throw error; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      console.error(
        `Error processing parcel ${realmId} (attempt ${retries + 1}):`,
        error
      );
      retries++;
      if (retries < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }
  }
  return false;
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

// Update the analyzeExistingFiles function
async function analyzeExistingFiles(analytics: ParcelAnalytics): Promise<void> {
  // Get all files in the directory
  const files = fs.readdirSync(DATA_DIR);

  // Process numbered parcel files (parcels1.json, parcels2.json, etc.)
  const normalParcelFiles = files.filter((file) =>
    file.match(/^parcels\d+\.json$/)
  );
  for (const file of normalParcelFiles) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Reading normal parcels from: ${filePath}`);
    const data = readJsonFile<Record<string, ParcelIO>>(filePath, {});

    for (const [realmId, parcel] of Object.entries(data)) {
      analytics.normalAddressParcels.add(realmId);
      analytics.uniqueNormalHolders.add(parcel.owner.toLowerCase());
    }
  }

  // Process special category files
  const specialFiles = [
    { path: PARCELS_CONTRACTS_FILE, type: "unknown_contract" },
    { path: PARCELS_CONTRACTS_WITH_OWNER_FILE, type: "contract_with_owner" },
    { path: PARCELS_VAULT_FILE, type: "vault" },
    { path: PARCELS_GBM_FILE, type: "gbm" },
    { path: PARCELS_RAFFLES_FILE, type: "raffles" },
    { path: PARCELS_IN_SAFE_FILE, type: "safe" },
  ];

  for (const file of specialFiles) {
    if (fs.existsSync(file.path)) {
      console.log(`Reading special file: ${file.path}`);
      const data = readJsonFile<Record<string, ParcelIO>>(file.path, {});

      for (const [realmId, parcel] of Object.entries(data)) {
        const owner = parcel.owner.toLowerCase();

        switch (file.type) {
          case "unknown_contract":
            analytics.unknownContractParcels.add(realmId);
            analytics.uniqueContractsWithoutOwners.add(owner);
            break;
          case "contract_with_owner":
            analytics.contractsWithOwnerParcels.add(realmId);
            analytics.uniqueContractsWithOwners.add(owner);
            break;
          case "vault":
            analytics.vaultParcels.add(realmId);
            break;
          case "gbm":
            analytics.gbmParcels.add(realmId);
            break;
          case "raffles":
            analytics.rafflesParcels.add(realmId);
            break;
          case "safe":
            analytics.gnosisSafeParcels.add(realmId);
            analytics.uniqueGnosisSafes.add(owner);
            break;
        }
      }
    }
  }

  console.log("\nAnalytics after analyzing existing files:");
  displayAnalytics(analytics);
}

function identifyMissingParcels(dataDir: string): string[] {
  const existingParcels = readAllParcelFiles(dataDir); // Use the function to read all parcel files
  const processedParcels = readJsonFile<string[]>(PROCESSED_REALMS_FILE, []);

  return processedParcels.filter(
    (parcelId) => !existingParcels.has(parcelId) // Check against the Set of existing parcels
  );
}

// Function to get all existing parcel IDs from all files
function getAllExistingParcelIds(): Set<string> {
  const allParcels = new Set<string>();

  // Get all files in the directory
  const files = fs.readdirSync(DATA_DIR);

  // Get numbered parcel files
  const numberedFiles = files.filter((file) =>
    file.match(/^parcels\d+\.json$/)
  );

  // Special category files
  const specialFiles = [
    "parcels-contracts.json",
    "parcels-contractsWithOwner.json",
    "parcels-vault.json",
    "parcels-gbm.json",
    "parcels-raffles.json",
    "parcels-safe.json",
  ];

  // Process all relevant files
  [...numberedFiles, ...specialFiles].forEach((file) => {
    const filePath = path.join(DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`Reading parcels from: ${file}`);
      const data = readJsonFile<Record<string, ParcelIO>>(filePath, {});
      Object.keys(data).forEach((parcelId) => allParcels.add(parcelId));
      console.log(`Found ${Object.keys(data).length} parcels in ${file}`);
    }
  });

  console.log(
    `Total unique parcels found across all files: ${allParcels.size}`
  );
  return allParcels;
}

// Modify validateProcessedParcels to use the consolidated function
async function validateProcessedParcels(
  realmGetterAndSetterFacet: RealmGettersAndSettersFacet,
  analytics: ParcelAnalytics
) {
  // Get all existing parcel IDs from all files
  const allExistingParcels = getAllExistingParcelIds();

  // Read processed parcels list
  const processedParcels = readJsonFile<string[]>(PROCESSED_REALMS_FILE, []);
  console.log(`Total processed parcels in list: ${processedParcels.length}`);

  // Find missing parcels
  const missingParcels = processedParcels.filter(
    (id) => !allExistingParcels.has(id)
  );

  if (missingParcels.length === 0) {
    console.log("All processed parcels were found in the output files.");
    return;
  }

  console.log(`Found ${missingParcels.length} parcels that need processing:`);
  console.log(missingParcels);

  // Process missing parcels
  for (const parcelId of missingParcels) {
    console.log(`Processing missing parcel ${parcelId}...`);
    const success = await processParcel(
      parcelId,
      realmGetterAndSetterFacet,
      analytics
    );
    if (success) {
      console.log(`Successfully processed parcel ${parcelId}`);
    } else {
      console.error(`Failed to process parcel ${parcelId}`);
    }
  }
}

let AllPARCELS;
// Function to read all parcel files in the DATA_DIR directory
function readAllParcelFiles(dataDir: string): Set<string> {
  const allParcels = new Set<string>();

  // Ensure the directory exists before reading its contents
  ensureDirectoryExists(dataDir);
  const allFiles = fs.readdirSync(dataDir);

  // Read the directory and filter out the processed-parcels.json file
  const parcelFiles = allFiles.filter(
    (file) => file !== "processed-parcels.json" && file.startsWith("parcels")
  );

  for (const file of parcelFiles) {
    const filePath = path.join(dataDir, file);

    try {
      const data = readJsonFile<Record<string, ParcelIO>>(filePath, {});
      // Add all keys (parcel IDs) to the set
      Object.keys(data).forEach((parcelId) => allParcels.add(parcelId));
    } catch (error) {
      console.error(`Error reading ${filePath}: ${error.message}`);
    }
  }
  AllPARCELS = Array.from(allParcels).length;
  console.log("Found:", Array.from(allParcels).length, "processed parcels"); // Log accumulated IDs
  return allParcels;
}

// Add this function to load existing analytics
function loadExistingAnalytics(): ParcelAnalytics {
  const analytics: ParcelAnalytics = {
    gnosisSafeParcels: new Set<string>(),
    normalAddressParcels: new Set<string>(),
    gbmParcels: new Set<string>(),
    vaultParcels: new Set<string>(),
    rafflesParcels: new Set<string>(),
    contractsWithOwnerParcels: new Set<string>(),
    unknownContractParcels: new Set<string>(),
    uniqueNormalHolders: new Set<string>(),
    uniqueContractsWithOwners: new Set<string>(),
    uniqueContractsWithoutOwners: new Set<string>(),
    uniqueGnosisSafes: new Set<string>(),
  };

  // Read all files in the DATA_DIR
  const files = fs.readdirSync(DATA_DIR);

  // Process normal address parcels from multiple files
  const normalParcelFiles = files.filter((file) =>
    file.match(/^parcels\d+\.json$/)
  );
  for (const file of normalParcelFiles) {
    const filePath = path.join(DATA_DIR, file);
    const parcels = readJsonFile<Record<string, ParcelIO>>(filePath, {});
    Object.entries(parcels).forEach(([parcelId, parcel]) => {
      analytics.normalAddressParcels.add(parcelId);
      analytics.uniqueNormalHolders.add(parcel.owner.toLowerCase());
    });
  }

  // Load data from other specific files
  const contractParcels = readJsonFile<Record<string, ParcelIO>>(
    PARCELS_CONTRACTS_FILE,
    {}
  );
  const contractsWithOwner = readJsonFile<Record<string, ParcelWithOwner>>(
    PARCELS_CONTRACTS_WITH_OWNER_FILE,
    {}
  );
  const vaultParcels = readJsonFile<Record<string, ParcelIO>>(
    PARCELS_VAULT_FILE,
    {}
  );
  const gbmParcels = readJsonFile<Record<string, ParcelIO>>(
    PARCELS_GBM_FILE,
    {}
  );
  const rafflesParcels = readJsonFile<Record<string, ParcelIO>>(
    PARCELS_RAFFLES_FILE,
    {}
  );
  const safeParcels = readJsonFile<Record<string, ParcelIO>>(
    PARCELS_IN_SAFE_FILE,
    {}
  );

  // Update analytics with data from special files
  Object.entries(vaultParcels).forEach(([parcelId]) => {
    analytics.vaultParcels.add(parcelId);
  });

  Object.entries(gbmParcels).forEach(([parcelId]) => {
    analytics.gbmParcels.add(parcelId);
  });

  Object.entries(rafflesParcels).forEach(([parcelId]) => {
    analytics.rafflesParcels.add(parcelId);
  });

  Object.entries(safeParcels).forEach(([parcelId, parcel]) => {
    analytics.gnosisSafeParcels.add(parcelId);
    analytics.uniqueGnosisSafes.add(parcel.owner);
  });

  Object.entries(contractsWithOwner).forEach(([parcelId, data]) => {
    analytics.contractsWithOwnerParcels.add(parcelId);
    if (data.parcel && data.parcel.owner) {
      analytics.uniqueContractsWithOwners.add(data.parcel.owner);
    }
  });

  Object.entries(contractParcels).forEach(([parcelId, parcel]) => {
    analytics.unknownContractParcels.add(parcelId);
    analytics.uniqueContractsWithoutOwners.add(parcel.owner);
  });

  console.log("\nLoaded existing analytics:");
  displayAnalytics(analytics);

  return analytics;
}

// Modify the main function to use existing analytics
async function main() {
  try {
    // First, fetch all parcel IDs that exist in the system
    const allRealmIds = await getParcelIds();
    console.log(`Total parcels on-chain: ${allRealmIds.length}`);

    // Initialize analytics with existing data
    const analytics = loadExistingAnalytics();

    // Find the current file index from existing files
    currentFileIndex = findCurrentFileIndex();

    // Read all existing parcels into a Set for faster lookups
    const processedParcels = new Set(readAllParcelFiles(DATA_DIR));
    console.log(
      `Found ${processedParcels.size} processed parcels in data files`
    );

    // Initialize directory and files if needed
    ensureDirectoryExists(DATA_DIR);

    const objectFiles = [
      PARCELS_FILE,
      PARCELS_CONTRACTS_FILE,
      PARCELS_CONTRACTS_WITH_OWNER_FILE,
      PARCELS_VAULT_FILE,
      PARCELS_GBM_FILE,
      PARCELS_RAFFLES_FILE,
    ];

    const arrayFiles = [PROCESSED_REALMS_FILE];

    objectFiles.forEach((file) => {
      if (!fs.existsSync(file)) {
        writeJsonFile(file, {});
      }
    });

    arrayFiles.forEach((file) => {
      if (!fs.existsSync(file)) {
        writeJsonFile(file, []);
      }
    });

    // Analyze existing files before starting new processing
    await analyzeExistingFiles(analytics);

    // Track newly processed parcels
    const newlyProcessedParcels = new Set<string>();

    // Find truly missing parcels
    const missingParcelIds = allRealmIds.filter(
      (id) => !processedParcels.has(id)
    );

    if (missingParcelIds.length > 0) {
      console.log(
        `\nFound ${missingParcelIds.length} unprocessed parcels to fetch:`
      );
      console.log(missingParcelIds);

      // Set up contract
      const c = await varsForNetwork(ethers);
      const realmGettersAndSettersFacet = await ethers.getContractAt(
        "RealmGettersAndSettersFacet",
        c.realmDiamond
      );

      // Process missing parcels
      for (const realmId of missingParcelIds) {
        console.log(`\nProcessing parcel ${realmId}...`);
        const success = await processParcel(
          realmId,
          realmGettersAndSettersFacet,
          analytics
        );

        if (success) {
          newlyProcessedParcels.add(realmId);
          processedParcels.add(realmId);

          // Log progress every 100 parcels
          if (newlyProcessedParcels.size % 100 === 0) {
            console.log(
              `\nProcessed ${newlyProcessedParcels.size}/${missingParcelIds.length} new parcels`
            );
            displayAnalytics(analytics);
          }
        } else {
          console.error(`Failed to process parcel ${realmId}`);
        }
      }

      // Show final results for this run
      if (newlyProcessedParcels.size > 0) {
        console.log(
          `\nCompleted processing ${newlyProcessedParcels.size} new parcels`
        );
        displayAnalytics(analytics);
      }
    } else {
      console.log(
        "\nNo missing parcels found - all parcels are already processed!"
      );
    }

    // Final verification
    const remainingMissing = allRealmIds.filter(
      (id) => !processedParcels.has(id)
    );
    if (remainingMissing.length > 0) {
      console.log(
        "\nWarning: Some parcels could not be processed:",
        remainingMissing
      );
    } else {
      console.log("\nSuccess: All parcels have been processed!");
    }

    console.log("\nFinal Summary:");
    console.log(`Total parcels in system: ${allRealmIds.length}`);
    console.log(`Total parcels processed: ${processedParcels.size}`);
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
