import { ethers } from "hardhat";
import {
  InstallationUpgradeFacet,
  RealmGettersAndSettersFacet,
} from "../../typechain-types";
// import { PARCELS_FILE, ParcelIO } from "./getParcelData";

import { getParcelIds } from "./getParcelMetadata";
import fs from "fs";
import path from "path";
import { varsForNetwork } from "../../constants";
import { ParcelIO } from "./getParcelMetadata";
import { DATA_DIR_PARCEL, writeBlockNumber } from "./paths";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { LedgerSigner } from "@anders-t/ethers-ledger";

const PROCESSED_UPGRADES_FILE = path.join(
  DATA_DIR_PARCEL,
  "metadata",
  "finalized-upgrades.json"
);
const BATCH_SIZE = 20;

// Simplified analytics interface
interface UpgradeAnalytics {
  parcelsWithUpgrades: Set<string>;
  totalUpgradeCount: number;
}

// Simplified display function
function displayUpgradeAnalytics(
  analytics: UpgradeAnalytics,
  processedUpgrades: Set<string>
) {
  console.log("\n=== Upgrade Analytics ===");
  console.log(
    `\nTotal parcels with pending upgrades: ${analytics.parcelsWithUpgrades.size}`
  );
  console.log(
    `Total individual upgrades to process: ${analytics.totalUpgradeCount}`
  );

  const validProcessedCount = Array.from(processedUpgrades).filter((id) =>
    analytics.parcelsWithUpgrades.has(id)
  ).length;

  console.log(
    `\nProgress: ${validProcessedCount}/${analytics.parcelsWithUpgrades.size} parcels processed ` +
      `(${(
        (validProcessedCount / analytics.parcelsWithUpgrades.size) *
        100
      ).toFixed(2)}%)`
  );
}

// Read/write processed upgrades
const readProcessedUpgrades = (): Set<string> =>
  new Set(
    fs.existsSync(PROCESSED_UPGRADES_FILE)
      ? JSON.parse(fs.readFileSync(PROCESSED_UPGRADES_FILE, "utf8"))
      : []
  );

const writeProcessedUpgrades = (processed: Set<string>): void =>
  fs.writeFileSync(
    PROCESSED_UPGRADES_FILE,
    JSON.stringify(Array.from(processed), null, 2)
  );

// Modified generator function to use on-chain data with batching
async function* findParcelsWithUpgrades(
  processedUpgrades: Set<string>,
  realmGettersAndSettersFacet: RealmGettersAndSettersFacet
): AsyncGenerator<{ parcelId: string; analytics: UpgradeAnalytics }> {
  const analytics: UpgradeAnalytics = {
    parcelsWithUpgrades: new Set<string>(),
    totalUpgradeCount: 0,
  };

  // await mine();

  const blockNumber = await writeBlockNumber("pendingUpgrades", ethers);
  const allParcelIds = await getParcelIds(blockNumber);
  console.log(`Found ${allParcelIds.length} total parcels to check`);

  let checkedCount = 0;
  let foundWithUpgrades = 0;
  const CHECK_BATCH_SIZE = 500; // Process 500 parcels at a time for checking

  // Process parcels in batches
  for (let i = 0; i < allParcelIds.length; i += CHECK_BATCH_SIZE) {
    const batchParcelIds = allParcelIds.slice(i, i + CHECK_BATCH_SIZE);
    checkedCount += batchParcelIds.length;

    try {
      const upgradeQueueLengths =
        await realmGettersAndSettersFacet.batchGetParcelUpgradeQueueLength(
          batchParcelIds
        );

      // Process results for this batch
      for (let j = 0; j < batchParcelIds.length; j++) {
        const parcelId = batchParcelIds[j];
        const queueLength = upgradeQueueLengths[j];

        if (queueLength.gt(0)) {
          foundWithUpgrades++;
          analytics.parcelsWithUpgrades.add(parcelId);
          analytics.totalUpgradeCount += queueLength.toNumber();
          console.log(
            `Found parcel ${parcelId} with ${queueLength.toNumber()} upgrades`
          );
          yield { parcelId, analytics };
        }
      }

      // Log progress
      console.log(
        `Checked ${checkedCount}/${allParcelIds.length} parcels (${(
          (checkedCount / allParcelIds.length) *
          100
        ).toFixed(2)}%)`
      );
      console.log(`Found ${foundWithUpgrades} parcels with upgrades so far`);
    } catch (error) {
      console.error(`Error checking batch of parcels:`, error);
    }
  }

  console.log(`\nFinal results:`);
  console.log(`Checked ${checkedCount} parcels`);
  console.log(`Found ${foundWithUpgrades} parcels with upgrades`);
  console.log(`Total upgrades to process: ${analytics.totalUpgradeCount}`);
}

async function processParcels(
  parcels: string[],
  processedUpgrades: Set<string>,
  installationUpgrade: InstallationUpgradeFacet
): Promise<number> {
  try {
    console.log(`Processing batch of ${parcels.length} parcels...`);
    // Commented out for testing
    const tx = await installationUpgrade.finalizeUpgradesForParcels(parcels);
    await tx.wait();

    for (const id of parcels) {
      processedUpgrades.add(id);
      writeProcessedUpgrades(processedUpgrades);
      console.log(`Successfully processed and saved progress for parcel ${id}`);
    }
    return parcels.length;
  } catch (error) {
    console.error(`Error processing parcels ${parcels.join(", ")}:`, error);
    return 0;
  }
}

async function main() {
  const processedUpgrades = readProcessedUpgrades();

  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/1'/0/0");
  console.log(`Found ${processedUpgrades.size} previously processed parcels`);

  const c = await varsForNetwork(ethers);
  const installationUpgrade = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond,
    signer
  )) as InstallationUpgradeFacet;

  const realmGettersAndSettersFacet = (await ethers.getContractAt(
    "RealmGettersAndSettersFacet",
    c.realmDiamond
  )) as RealmGettersAndSettersFacet;

  let currentBatch: string[] = [];
  let totalProcessed = 0;
  let latestAnalytics: UpgradeAnalytics | null = null;
  const PROCESS_BATCH_SIZE = 50; // Process 20 parcels at a time for upgrades

  for await (const { parcelId, analytics } of findParcelsWithUpgrades(
    processedUpgrades,
    realmGettersAndSettersFacet
  )) {
    latestAnalytics = analytics;

    if (processedUpgrades.has(parcelId)) {
      console.log(`Skipping already processed parcel ${parcelId}`);
      continue;
    }

    currentBatch.push(parcelId);
    if (currentBatch.length >= PROCESS_BATCH_SIZE) {
      console.log(
        `\nReached batch size of ${PROCESS_BATCH_SIZE}, processing upgrades...`
      );
      totalProcessed += await processParcels(
        currentBatch,
        processedUpgrades,
        installationUpgrade
      );
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    console.log(`\nProcessing remaining ${currentBatch.length} parcels...`);
    totalProcessed += await processParcels(
      currentBatch,
      processedUpgrades,
      installationUpgrade
    );
  }

  if (latestAnalytics) {
    displayUpgradeAnalytics(latestAnalytics, processedUpgrades);
    totalProcessed = Array.from(processedUpgrades).filter((id) =>
      latestAnalytics.parcelsWithUpgrades.has(id)
    ).length;
  }

  console.log(`\nCompleted processing ${totalProcessed} parcels with upgrades`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
