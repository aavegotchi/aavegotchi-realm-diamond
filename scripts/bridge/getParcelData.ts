import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { varsForNetwork } from "../../constants";
import {
  vault,
  gbmDiamond,
  rafflesContract,
  excludedAddresses,
  getOwner,
  isSafe,
  rafflesContract2,
  PC,
  voucherContract,
} from "./getInstallationAndTileData";
import { DATA_DIR_PARCEL } from "./paths";

const config = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.MATIC_MAINNET,
};

export const PARCELS_CONTRACT = "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";

const FILES = {
  normal: path.join(DATA_DIR_PARCEL, "parcels-balances.json"),
  contracts: path.join(DATA_DIR_PARCEL, "parcels-contracts.json"),
  contractsWithOwner: path.join(
    DATA_DIR_PARCEL,
    "parcels-contractsWithOwner.json"
  ),
  gbm: path.join(DATA_DIR_PARCEL, "parcels-gbm.json"),
  raffles: path.join(DATA_DIR_PARCEL, "parcels-raffles.json"),
  safe: path.join(DATA_DIR_PARCEL, "gnosisSafe-parcels.json"),
  processed: path.join(DATA_DIR_PARCEL, "processed-holders.json"),
};

export async function getVaultOwner(tokenIds: string[], ethers: any) {
  const vaultContract = await ethers.getContractAt("IVault", vault);
  const owners: Record<string, string> = {};

  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i];
    try {
      // Convert string token ID to numeric ID
      const numericTokenId = parseInt(tokenId);
      if (isNaN(numericTokenId)) {
        console.error(`Invalid token ID format: ${tokenId}`);
        continue;
      }

      console.log(
        `[VAULT OWNER] (${i + 1}/${
          tokenIds.length
        }) Getting owner for tokenId: ${tokenId} (numeric: ${numericTokenId})`
      );
      const owner = await vaultContract.getDepositor(
        PARCELS_CONTRACT,
        numericTokenId
      );
      owners[tokenId] = owner.toLowerCase();
    } catch (error) {
      console.error(`Error getting vault owner for token ${tokenId}:`, error);
    }
  }

  console.log(`Found ${Object.keys(owners).length} vault owners`);
  return owners;
}

const BATCH_SIZE = 100;
const MAX_CONSECUTIVE_ERRORS = 5;
const RESTART_DELAY = 30000;

interface TokenHolder {
  ownerAddress: string;
  tokenBalances: {
    tokenId: string;
    balance: string;
  }[];
}

interface ContractEOAHolder {
  contractOwner: string;
  tokens: TokenHolder;
}

interface SafeDetails {
  safeAddress: string;
  tokenBalances: {
    tokenId: string;
  }[];
}

// Add interface for analytics
interface ParcelAnalytics {
  gnosisSafeParcels: Set<string>;
  normalAddressParcels: Set<string>;
  gbmParcels: Set<string>;
  vaultParcels: Set<string>;
  contractsWithOwnerParcels: Set<string>;
  unknownContractParcels: Set<string>;
  uniqueNormalHolders: Set<string>;
  uniqueContractsWithOwners: Set<string>;
  uniqueContractsWithoutOwners: Set<string>;
  uniqueGnosisSafes: Set<string>;
  pixelcraftAllocatedParcels: Set<string>;
}

// Add function to display analytics
function displayAnalytics(analytics: ParcelAnalytics) {
  console.log("\n=== Parcel Distribution Analytics ===");
  console.log("\nParcel Counts:");
  console.log(`Parcels in Gnosis Safes: ${analytics.gnosisSafeParcels.size}`);
  console.log(
    `Parcels held by normal addresses: ${analytics.normalAddressParcels.size}`
  );
  console.log(`Parcels in GBM: ${analytics.gbmParcels.size}`);
  console.log(`Parcels in Vault: ${analytics.vaultParcels.size}`);
  console.log(
    `Parcels in contracts with known owners: ${analytics.contractsWithOwnerParcels.size}`
  );
  console.log(
    `Parcels in unknown contracts: ${analytics.unknownContractParcels.size}`
  );
  console.log(
    `Parcels allocated to Pixelcraft: ${analytics.pixelcraftAllocatedParcels.size}`
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
    analytics.contractsWithOwnerParcels.size +
    analytics.unknownContractParcels.size +
    analytics.pixelcraftAllocatedParcels.size;

  const totalUniqueHolders =
    analytics.uniqueNormalHolders.size +
    analytics.uniqueContractsWithOwners.size +
    analytics.uniqueContractsWithoutOwners.size +
    analytics.uniqueGnosisSafes.size;

  console.log(`\nTotal parcels: ${totalParcels}`);
  console.log(`Total unique holders: ${totalUniqueHolders}`);
}

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
    return JSON.parse(content) as T;
  } catch (error) {
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    throw error;
  }
}

// Modify updateParcelData function to track analytics
async function updateParcelData(): Promise<void> {
  const c = await varsForNetwork(ethers);
  const alchemy = new Alchemy(config);

  const analytics: ParcelAnalytics = {
    gnosisSafeParcels: new Set<string>(),
    normalAddressParcels: new Set<string>(),
    gbmParcels: new Set<string>(),
    vaultParcels: new Set<string>(),
    contractsWithOwnerParcels: new Set<string>(),
    unknownContractParcels: new Set<string>(),
    uniqueNormalHolders: new Set<string>(),
    uniqueContractsWithOwners: new Set<string>(),
    uniqueContractsWithoutOwners: new Set<string>(),
    uniqueGnosisSafes: new Set<string>(),
    pixelcraftAllocatedParcels: new Set<string>(),
  };

  try {
    ensureDirectoryExists(DATA_DIR_PARCEL);

    const response = await alchemy.nft.getOwnersForContract(c.realmDiamond, {
      withTokenBalances: true,
    });

    const holders = response.owners;
    let normalHolders: Record<string, TokenHolder> = {};
    let contractHolders: TokenHolder[] = [];
    let contractsWithOwner: ContractEOAHolder[] = [];
    let gbmHolders: TokenHolder[] = [];
    let rafflesHolders: TokenHolder[] = [];
    let safeHolders: SafeDetails[] = [];

    const processedHolders = readJsonFile<string[]>(FILES.processed, []);
    let batchCount = 0;
    let consecutiveErrors = 0;

    for (const holder of holders) {
      const { ownerAddress } = holder;

      if (
        processedHolders.includes(ownerAddress) ||
        excludedAddresses.includes(ownerAddress)
      ) {
        continue;
      }

      try {
        if (ownerAddress.toLowerCase() === vault.toLowerCase()) {
          console.log(`Processing vault tokens`);

          // Track vault tokens in analytics before resolving
          holder.tokenBalances.forEach((token) => {
            analytics.vaultParcels.add(token.tokenId);
          });

          const trueOwners = await getVaultOwner(
            holder.tokenBalances.map((token) => token.tokenId),
            ethers
          );

          // Group the holders by owner
          const tokensByOwner = holder.tokenBalances.reduce(
            (acc: Record<string, string[]>, token) => {
              const trueOwner = trueOwners[token.tokenId];
              if (!acc[trueOwner]) acc[trueOwner] = [];
              acc[trueOwner].push(token.tokenId);
              return acc;
            },
            {}
          );

          // Add each owner's tokens to normalHolders
          for (const [owner, tokenIds] of Object.entries(tokensByOwner)) {
            if (!normalHolders[owner]) {
              normalHolders[owner] = {
                ownerAddress: owner,
                tokenBalances: [],
              };
            }
            normalHolders[owner].tokenBalances.push(
              ...tokenIds.map((tokenId) => ({
                tokenId,
                balance: "1",
              }))
            );

            // Update analytics
            tokenIds.forEach((tokenId) => {
              analytics.normalAddressParcels.add(tokenId);
            });
            analytics.uniqueNormalHolders.add(owner);
          }
        } else if (ownerAddress.toLowerCase() === gbmDiamond.toLowerCase()) {
          gbmHolders.push(holder);
          holder.tokenBalances.forEach((token) =>
            analytics.gbmParcels.add(token.tokenId)
          );
        } else if (
          ownerAddress.toLowerCase() === rafflesContract.toLowerCase() ||
          ownerAddress.toLowerCase() === rafflesContract2.toLowerCase()
        ) {
          // Allocate raffle contract tokens to Pixelcraft
          const pixelcraftHolder: TokenHolder = {
            ownerAddress: PC,
            tokenBalances: holder.tokenBalances,
          };
          normalHolders[PC] = pixelcraftHolder;
          holder.tokenBalances.forEach((token) => {
            analytics.pixelcraftAllocatedParcels.add(token.tokenId);
          });
        } else if (
          ownerAddress.toLowerCase() === voucherContract.toLowerCase()
        ) {
          // Allocate voucher contract tokens to Pixelcraft
          const pixelcraftHolder: TokenHolder = {
            ownerAddress: PC,
            tokenBalances: holder.tokenBalances,
          };
          normalHolders[PC] = pixelcraftHolder;
          holder.tokenBalances.forEach((token) => {
            analytics.pixelcraftAllocatedParcels.add(token.tokenId);
          });
        } else {
          const code = await ethers.provider.getCode(ownerAddress);
          if (code !== "0x") {
            const contractOwner = await getOwner(ownerAddress);
            if (contractOwner) {
              contractsWithOwner.push({ contractOwner, tokens: holder });
              holder.tokenBalances.forEach((token) =>
                analytics.contractsWithOwnerParcels.add(token.tokenId)
              );
              analytics.uniqueContractsWithOwners.add(ownerAddress);
            } else if (await isSafe(ownerAddress)) {
              safeHolders.push({
                safeAddress: ownerAddress,
                tokenBalances: holder.tokenBalances,
              });
              holder.tokenBalances.forEach((token) =>
                analytics.gnosisSafeParcels.add(token.tokenId)
              );
              analytics.uniqueGnosisSafes.add(ownerAddress);
            } else {
              contractHolders.push(holder);
              holder.tokenBalances.forEach((token) =>
                analytics.unknownContractParcels.add(token.tokenId)
              );
              analytics.uniqueContractsWithoutOwners.add(ownerAddress);
            }
          } else {
            normalHolders[ownerAddress] = holder;
            holder.tokenBalances.forEach((token) =>
              analytics.normalAddressParcels.add(token.tokenId)
            );
            analytics.uniqueNormalHolders.add(ownerAddress);
          }
        }

        processedHolders.push(ownerAddress);
        batchCount++;
        consecutiveErrors = 0;

        if (batchCount >= BATCH_SIZE) {
          console.log(`Saving batch of ${batchCount} processed holders...`);
          writeJsonFile(FILES.processed, processedHolders);

          // Write main data files every batch
          console.log("[Batch] Writing main data files...");
          writeJsonFile(FILES.normal, normalHolders);
          writeJsonFile(FILES.contracts, contractHolders);
          writeJsonFile(FILES.contractsWithOwner, contractsWithOwner);
          writeJsonFile(FILES.gbm, gbmHolders);
          writeJsonFile(FILES.raffles, rafflesHolders);
          writeJsonFile(FILES.safe, safeHolders);

          batchCount = 0;
        }

        // Log progress every 100 holders
        if (batchCount % 100 === 0) {
          displayAnalytics(analytics);
        }
      } catch (error) {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          writeJsonFile(FILES.processed, processedHolders);
          await new Promise((resolve) => setTimeout(resolve, RESTART_DELAY));
          consecutiveErrors = 0;
        }
      }
    }

    // Save remaining processed holders and any pending data from the last batch
    if (batchCount > 0) {
      console.log(`Saving remaining ${batchCount} processed holders...`);
      writeJsonFile(FILES.processed, processedHolders);

      // Write main data files for the last partial batch
      console.log("[Final Batch] Writing main data files...");
      writeJsonFile(FILES.normal, normalHolders);
      writeJsonFile(FILES.contracts, contractHolders);
      writeJsonFile(FILES.contractsWithOwner, contractsWithOwner);
      writeJsonFile(FILES.gbm, gbmHolders);
      writeJsonFile(FILES.raffles, rafflesHolders);
      writeJsonFile(FILES.safe, safeHolders);
    }

    console.log(
      "\n[Final Save] Ensuring all data is written to respective files one last time..."
    );
    writeJsonFile(FILES.normal, normalHolders);
    writeJsonFile(FILES.contracts, contractHolders);
    writeJsonFile(FILES.contractsWithOwner, contractsWithOwner);
    writeJsonFile(FILES.gbm, gbmHolders);
    writeJsonFile(FILES.raffles, rafflesHolders);
    writeJsonFile(FILES.safe, safeHolders);

    // Display final analytics
    console.log("\nFinal Analytics:");
    displayAnalytics(analytics);
  } catch (error) {
    throw error;
  }
}

async function main() {
  try {
    await updateParcelData();
  } catch (error) {
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      process.exit(1);
    });
}
