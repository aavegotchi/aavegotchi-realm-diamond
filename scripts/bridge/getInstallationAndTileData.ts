import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { varsForNetwork } from "../../constants";
import { getVaultOwner } from "./getParcelData";
import { DATA_DIR, writeBlockNumber } from "./paths";
import { DATA_DIR_TILES } from "./paths";
import { DATA_DIR_INSTALLATIONS } from "./paths";

export const excludedAddresses = [
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dEaD",
  "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
];

export const vault = "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63";
export const gbmDiamond = "0xD5543237C656f25EEA69f1E247b8Fa59ba353306";
export const rafflesContract = "0x6c723cac1E35FE29a175b287AE242d424c52c1CE";
export const rafflesContract2 = "0xa85f5a59a71842fddaabd4c2cd373300a31750d8";
export const PC = "0x01F010a5e001fe9d6940758EA5e8c777885E351e";
export const voucherContract = "0xd5724BCA82423D5792C676cd453c1Bf66151dC04";

const config = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.MATIC_MAINNET,
};

interface TokenHolder {
  ownerAddress: string;
  tokenBalances: {
    tokenId: string;
    balance: string;
  }[];
}

export interface SafeDetails {
  safeAddress: string;
  tokenBalances: {
    tokenId: string;
  }[];
}

interface ContractEOAHolder {
  contractOwner: string;
  tokens: TokenHolder;
}

const CONTRACTS = {
  installations: "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A",
  tiles: "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355",
} as const;

const FILES = {
  installations: path.join(
    DATA_DIR_INSTALLATIONS,
    "installations-balances.json"
  ),
  tiles: path.join(DATA_DIR_TILES, "tiles-balances.json"),
  installationsContracts: path.join(
    DATA_DIR_INSTALLATIONS,
    "installations-contractsHolders.json"
  ),
  tilesContracts: path.join(DATA_DIR_TILES, "tiles-contractsHolders.json"),
  gbmDiamondInstallations: path.join(
    DATA_DIR_INSTALLATIONS,
    "gbmDiamond-installations.json"
  ),
  gbmDiamondTiles: path.join(DATA_DIR_TILES, "gbmDiamond-tiles.json"),
  realmDiamondInstallations: path.join(
    DATA_DIR_INSTALLATIONS,
    "realmDiamond-installations.json"
  ),
  realmDiamondTiles: path.join(DATA_DIR_TILES, "realmDiamond-tiles.json"),
  installationsContractHolderEOAs: path.join(
    DATA_DIR_INSTALLATIONS,
    "installations-EOAs.json"
  ),
  tilesContractHolderEOAs: path.join(DATA_DIR_TILES, "tiles-EOAs.json"),
  rafflesInstallations: path.join(
    DATA_DIR_INSTALLATIONS,
    "raffles-installations.json"
  ),
  rafflesTiles: path.join(DATA_DIR_TILES, "raffles-tiles.json"),
  gnosisSafeInstallations: path.join(
    DATA_DIR_INSTALLATIONS,
    "gnosisSafe-installations.json"
  ),
  gnosisSafeTiles: path.join(DATA_DIR_TILES, "gnosisSafe-tiles.json"),
} as const;

const alchemy = new Alchemy(config);

const BATCH_SIZE = 100; // Process 100 holders before saving
const MAX_CONSECUTIVE_ERRORS = 5;
const RESTART_DELAY = 30000; // 30 seconds

// Separate processed holders files for installations and tiles
const PROCESSED_INSTALLATIONS_HOLDERS_FILE = path.join(
  DATA_DIR_INSTALLATIONS,
  "processed-installations-holders.json"
);
const PROCESSED_TILES_HOLDERS_FILE = path.join(
  DATA_DIR_TILES,
  "processed-tiles-holders.json"
);

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
    const parsed = JSON.parse(content);
    return parsed as T;
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing to ${filePath}: ${error.message}`);
  }
}

async function updateHolderData(
  contractAddress: string,
  filename: string,
  contractHoldersFilename: string,
  realmDiamondFilename: string,
  gbmDiamondFilename: string,
  contractHolderEOAsFilename: string,
  gnosisSafeContractsFilename: string,
  processedHoldersFile: string
): Promise<void> {
  try {
    const c = await varsForNetwork(ethers);
    console.log("\n=== Starting holder data update ===");
    console.log(`Contract Address: ${contractAddress}`);

    ensureDirectoryExists(DATA_DIR);
    ensureDirectoryExists(DATA_DIR_INSTALLATIONS);
    ensureDirectoryExists(DATA_DIR_TILES);
    console.log("Ensuring all data directory exists...");

    console.log("\nFetching holders from Alchemy...");
    const response = await alchemy.nft.getOwnersForContract(contractAddress, {
      withTokenBalances: true,
    });
    const holders = response.owners;
    console.log(`Found ${holders.length} total holders`);

    let existingData = readJsonFile<Record<string, TokenHolder>>(filename, {});
    const contractHolders: TokenHolder[] = [];
    const realmDiamondHolders: TokenHolder[] = [];
    const contractEOAs: ContractEOAHolder[] = [];
    const gbmDiamondHolders: TokenHolder[] = [];
    const gnosisSafeContracts: SafeDetails[] = [];

    let regularHoldersCount = 0;
    let contractHoldersCount = 0;
    let excludedCount = 0;
    let raffleTokensAllocatedToPC = 0;
    const processedHolders = readJsonFile<string[]>(processedHoldersFile, []);
    console.log(`Found ${processedHolders.length} already processed holders`);

    let consecutiveErrors = 0;
    let batchCount = 0;

    for (let i = 0; i < holders.length; i++) {
      const holder = holders[i];
      const { ownerAddress } = holder;

      // Skip if already processed
      if (processedHolders.includes(ownerAddress)) {
        console.log(`Skipping already processed holder ${ownerAddress}`);
        continue;
      }

      try {
        if (excludedAddresses.includes(ownerAddress)) {
          excludedCount++;
          continue;
        }

        existingData[ownerAddress] = holder;

        if (ownerAddress.toLowerCase() === c.realmDiamond.toLowerCase()) {
          realmDiamondHolders.push(holder);
          delete existingData[ownerAddress];
        } else if (ownerAddress.toLowerCase() === vault.toLowerCase()) {
          //get the vault depositor
          const trueOwners = await getVaultOwner(
            holder.tokenBalances.map((token) => token.tokenId),
            ethers
          );

          // Group tokens by their true owners, filtering out tokens with undefined owners
          const tokensByOwner = holder.tokenBalances.reduce(
            (acc: Record<string, string[]>, token) => {
              const trueOwner = trueOwners[token.tokenId];

              // Only process tokens that have a valid owner
              if (trueOwner && trueOwner !== "undefined") {
                if (!acc[trueOwner]) acc[trueOwner] = [];
                acc[trueOwner].push(token.tokenId);
              } else {
                console.warn(
                  `Skipping token ${token.tokenId} - no valid owner found in vault`
                );
              }
              return acc;
            },
            {}
          );

          // Add each owner's tokens to existingData
          for (const [owner, tokenIds] of Object.entries(tokensByOwner)) {
            // Additional validation to ensure owner is not undefined
            if (!owner || owner === "undefined") {
              const errorMsg = `Attempting to add an entry with undefined owner! Category: vault`;
              console.error(errorMsg, { owner, tokenIds });
              continue; // Skip this entry instead of throwing
            }

            if (!existingData[owner]) {
              existingData[owner] = {
                ownerAddress: owner,
                tokenBalances: [],
              };
            }
            existingData[owner].tokenBalances.push(
              ...tokenIds.map((tokenId) => ({
                tokenId,
                balance: "1",
              }))
            );
          }

          delete existingData[ownerAddress];
        } else if (ownerAddress.toLowerCase() === gbmDiamond.toLowerCase()) {
          gbmDiamondHolders.push(holder);
          delete existingData[ownerAddress];
        } else if (
          ownerAddress.toLowerCase() === rafflesContract.toLowerCase() ||
          ownerAddress.toLowerCase() === rafflesContract2.toLowerCase()
        ) {
          // Allocate raffle contract tokens to PC
          if (!existingData[PC]) {
            existingData[PC] = {
              ownerAddress: PC,
              tokenBalances: [],
            };
          }
          existingData[PC].tokenBalances.push(...holder.tokenBalances);
          raffleTokensAllocatedToPC += holder.tokenBalances.length;
          delete existingData[ownerAddress];
        } else {
          const code = await ethers.provider.getCode(ownerAddress);
          if (code !== "0x") {
            contractHoldersCount++;
            const contractOwner = await getOwner(ownerAddress);
            if (contractOwner) {
              contractEOAs.push({ contractOwner, tokens: holder });
            } else if (isSafe(ownerAddress)) {
              const gnosisObject = {
                safeAddress: ownerAddress,
                tokenBalances: holder.tokenBalances,
              };

              gnosisSafeContracts.push(gnosisObject);
            } else {
              contractHolders.push(holder);
            }
            delete existingData[ownerAddress];
          } else {
            regularHoldersCount++;
          }
        }

        // On successful processing
        processedHolders.push(ownerAddress);
        batchCount++;
        consecutiveErrors = 0;

        // Save progress periodically
        if (batchCount >= BATCH_SIZE) {
          console.log(`Saving batch of ${batchCount} processed holders...`);
          writeJsonFile(processedHoldersFile, processedHolders);

          // Write main data files every batch
          const filesToWrite = [
            { path: filename, data: existingData, name: "Regular holders" },
            {
              path: contractHoldersFilename,
              data: contractHolders,
              name: "Contract holders",
            },
            {
              path: realmDiamondFilename,
              data: realmDiamondHolders,
              name: "Realm Diamond holders",
            },
            {
              path: gbmDiamondFilename,
              data: gbmDiamondHolders,
              name: "GBM Diamond holders",
            },
            {
              path: contractHolderEOAsFilename,
              data: contractEOAs,
              name: "Contract EOA holders",
            },
            {
              path: gnosisSafeContractsFilename,
              data: gnosisSafeContracts,
              name: "Gnosis Safe contracts",
            },
          ];
          for (const { path, data, name } of filesToWrite) {
            console.log(`[Batch] Writing ${name} to ${path}...`);
            writeJsonFile(path, data);
          }

          batchCount = 0;
        }
      } catch (error) {
        console.error(`Error processing holder ${ownerAddress}:`, error);
        consecutiveErrors++;

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.log(
            `\nToo many consecutive errors (${consecutiveErrors}). Waiting before continuing...`
          );
          writeJsonFile(processedHoldersFile, processedHolders);
          await new Promise((resolve) => setTimeout(resolve, RESTART_DELAY));
          consecutiveErrors = 0; // Reset counter after delay
          continue;
        }
      }

      if ((i + 1) % 100 === 0 || i === holders.length - 1) {
        const progress = (((i + 1) / holders.length) * 100).toFixed(2);
        console.log(`Progress: ${progress}% (${i + 1}/${holders.length})`);
        console.log(`Regular holders: ${regularHoldersCount}`);
        console.log(`All Contract holders: ${contractHoldersCount}`);
        console.log(`Irregular Contracts: ${contractHolders.length}`);
        console.log(`Excluded addresses: ${excludedCount}`);
        console.log(`Realm Diamond holders: ${realmDiamondHolders.length}`);
        console.log(`GBM Diamond holds: ${gbmDiamondHolders.length} `);
        console.log(
          `Raffle tokens allocated to PC: ${raffleTokensAllocatedToPC}\n`
        );
        console.log(`Gnosis Safe contracts: ${gnosisSafeContracts.length}\n`);
      }
    }

    // Save any remaining processed holders
    if (batchCount > 0) {
      writeJsonFile(processedHoldersFile, processedHolders);
      // Write main data files for the last partial batch
      const filesToWrite = [
        { path: filename, data: existingData, name: "Regular holders" },
        {
          path: contractHoldersFilename,
          data: contractHolders,
          name: "Contract holders",
        },
        {
          path: realmDiamondFilename,
          data: realmDiamondHolders,
          name: "Realm Diamond holders",
        },
        {
          path: gbmDiamondFilename,
          data: gbmDiamondHolders,
          name: "GBM Diamond holders",
        },
        {
          path: contractHolderEOAsFilename,
          data: contractEOAs,
          name: "Contract EOA holders",
        },
        {
          path: gnosisSafeContractsFilename,
          data: gnosisSafeContracts,
          name: "Gnosis Safe contracts",
        },
      ];
      for (const { path, data, name } of filesToWrite) {
        console.log(`[Batch] Writing ${name} to ${path}...`);
        writeJsonFile(path, data);
      }
    }

    console.log("\n=== Final Summary ===");
    console.log(`Total holders processed: ${holders.length}`);
    console.log(`Regular holders: ${regularHoldersCount}`);
    console.log(`Contract holders: ${contractHoldersCount}`);
    console.log(`Excluded addresses: ${excludedCount}`);
    console.log(`Special contract holders:`);
    console.log(`Realm Diamond holds: ${realmDiamondHolders.length}`);
    console.log(`GBM Diamond holds: ${gbmDiamondHolders.length} `);
    console.log(`Raffle tokens allocated to PC: ${raffleTokensAllocatedToPC}`);
    console.log(`Gnosis Safe contracts: ${gnosisSafeContracts.length}`);
  } catch (error) {
    console.error("\n=== Error in updateHolderData ===");
    console.error(error);
    throw error;
  }
}

export const getOwner = async (contractAddress: string): Promise<string> => {
  try {
    const owner = await ethers.getContractAt(
      "contracts/interfaces/Ownable.sol:Ownable",
      contractAddress
    );
    return await owner.owner();
  } catch (error) {
    console.debug(`Ùnknown contract without owner`);
    return "";
  }
};

export const isSafe = async (contractAddress: string): Promise<boolean> => {
  try {
    const safe = await ethers.getContractAt("ISafe", contractAddress);
    const version = await safe.VERSION();
    return version === "1.3.0";
  } catch (error) {
    return false;
  }
};

async function main() {
  try {
    console.log("Starting installation and tile data update...");

    console.log("\nProcessing installations...");
    await writeBlockNumber("installation", ethers);
    await updateHolderData(
      CONTRACTS.installations,
      FILES.installations,
      FILES.installationsContracts,
      FILES.realmDiamondInstallations,
      FILES.gbmDiamondInstallations,
      FILES.installationsContractHolderEOAs,
      FILES.gnosisSafeInstallations,
      PROCESSED_INSTALLATIONS_HOLDERS_FILE
    );

    console.log("\nProcessing tiles...");
    await writeBlockNumber("tile", ethers);
    await updateHolderData(
      CONTRACTS.tiles,
      FILES.tiles,
      FILES.tilesContracts,
      FILES.realmDiamondTiles,
      FILES.gbmDiamondTiles,
      FILES.tilesContractHolderEOAs,
      FILES.gnosisSafeTiles,
      PROCESSED_TILES_HOLDERS_FILE
    );

    console.log("\nAll data processing completed successfully");
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
