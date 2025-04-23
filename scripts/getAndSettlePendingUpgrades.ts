import { ethers } from "hardhat";
import { InstallationUpgradeFacet } from "../typechain-types";
// import { PARCELS_FILE, ParcelIO } from "./getParcelData";

import fs from "fs";
import path from "path";
import { varsForNetwork } from "../constants";
import { ParcelIO } from "./getParcelMetadata";

const DATA_DIR = path.join(__dirname, "cloneData", "parcel", "metadata");
const PROCESSED_UPGRADES_FILE = path.join(DATA_DIR, "processed-upgrades.json");
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

// Simplified generator function
async function* findParcelsWithUpgrades(
  processedUpgrades: Set<string>
): AsyncGenerator<{ parcelId: string; analytics: UpgradeAnalytics }> {
  const analytics: UpgradeAnalytics = {
    parcelsWithUpgrades: new Set<string>(),
    totalUpgradeCount: 0,
  };

  const files = fs
    .readdirSync(DATA_DIR)
    .filter(
      (file) =>
        file.endsWith(".json") &&
        !["processed-parcels.json", "processed-upgrades.json"].includes(file)
    );

  for (const file of files) {
    console.log(`Processing ${file} for upgrades...`);
    const parcelsJson = JSON.parse(
      await fs.promises.readFile(path.join(DATA_DIR, file), "utf8")
    );

    for (const [parcelId, parcelData] of Object.entries(parcelsJson)) {
      //@ts-ignore
      const upgradeCount = parseInt(parcelData.upgradeQueueLength.hex, 16);
      if (upgradeCount > 0) {
        analytics.parcelsWithUpgrades.add(parcelId);
        analytics.totalUpgradeCount += upgradeCount;
        yield { parcelId, analytics };
      }
    }
  }
}

async function processParcels(
  parcels: string[],
  processedUpgrades: Set<string>
): Promise<number> {
  try {
    // const tx = await installationUpgrade.finalizeUpgradesForParcels(parcels);
    // await tx.wait();

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
  console.log(`Found ${processedUpgrades.size} previously processed parcels`);

  const c = await varsForNetwork(ethers);
  const installationUpgrade = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond
  )) as InstallationUpgradeFacet;

  let currentBatch: string[] = [];
  let totalProcessed = 0;
  let latestAnalytics: UpgradeAnalytics | null = null;

  for await (const { parcelId, analytics } of findParcelsWithUpgrades(
    processedUpgrades
  )) {
    latestAnalytics = analytics;

    if (processedUpgrades.has(parcelId)) {
      console.log(`Skipping already processed parcel ${parcelId}`);
      continue;
    }

    currentBatch.push(parcelId);
    if (currentBatch.length === BATCH_SIZE) {
      totalProcessed += await processParcels(currentBatch, processedUpgrades);
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    totalProcessed += await processParcels(currentBatch, processedUpgrades);
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
