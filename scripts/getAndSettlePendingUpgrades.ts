import { ethers } from "hardhat";
import { InstallationUpgradeFacet } from "../typechain-types";
// import { PARCELS_FILE, ParcelIO } from "./getParcelData";

import fs from "fs";
import path from "path";
import { varsForNetwork } from "../constants";
import { ParcelIO } from "./getParcelMetadata";

const DATA_DIR = path.join(__dirname, "cloneData", "parcel", "metadata");
const PROCESSED_UPGRADES_FILE = path.join(DATA_DIR, "processed-upgrades.json");
const BATCH_SIZE = 2;

// Add interface for upgrade analytics
interface UpgradeAnalytics {
  normalParcelsWithUpgrades: Set<string>;
  contractParcelsWithUpgrades: Set<string>;
  contractsWithOwnerUpgrades: Set<string>;
  vaultParcelsWithUpgrades: Set<string>;
  gbmParcelsWithUpgrades: Set<string>;
  rafflesParcelsWithUpgrades: Set<string>;
  safeParcelsWithUpgrades: Set<string>;
  totalUpgradeCount: number;
}

// Add function to display upgrade analytics
function displayUpgradeAnalytics(
  analytics: UpgradeAnalytics,
  processedUpgrades: Set<string>
) {
  const categories = {
    "Normal addresses": analytics.normalParcelsWithUpgrades,
    "Unknown contracts": analytics.contractParcelsWithUpgrades,
    "Contracts with known owners": analytics.contractsWithOwnerUpgrades,
    Vault: analytics.vaultParcelsWithUpgrades,
    GBM: analytics.gbmParcelsWithUpgrades,
    Raffles: analytics.rafflesParcelsWithUpgrades,
    "Gnosis Safe": analytics.safeParcelsWithUpgrades,
  };

  // Get all parcels that need upgrades
  const allParcelsNeedingUpgrades = new Set<string>();
  Object.values(categories).forEach((set) =>
    set.forEach((parcelId) => allParcelsNeedingUpgrades.add(parcelId))
  );

  console.log("\n=== Upgrade Analytics ===");
  console.log("\nParcels with Pending Upgrades by Category:");
  Object.entries(categories).forEach(([name, set]) => {
    console.log(`${name}: ${set.size}`);
  });

  const totalParcelsWithUpgrades = allParcelsNeedingUpgrades.size;

  // Only count processed parcels that actually need upgrades
  const validProcessedCount = Array.from(processedUpgrades).filter((id) =>
    allParcelsNeedingUpgrades.has(id)
  ).length;

  console.log(
    `\nTotal parcels with pending upgrades: ${totalParcelsWithUpgrades}`
  );
  console.log(
    `Total individual upgrades to process: ${analytics.totalUpgradeCount}`
  );

  console.log(
    `\nProgress: ${validProcessedCount}/${totalParcelsWithUpgrades} parcels processed ` +
      `(${((validProcessedCount / totalParcelsWithUpgrades) * 100).toFixed(
        2
      )}%)`
  );
}

// Add function to read/write processed upgrades
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

async function* findParcelsWithUpgrades(
  processedUpgrades: Set<string>
): AsyncGenerator<{ parcelId: string; analytics: UpgradeAnalytics }> {
  const analytics: UpgradeAnalytics = {
    normalParcelsWithUpgrades: new Set<string>(),
    contractParcelsWithUpgrades: new Set<string>(),
    contractsWithOwnerUpgrades: new Set<string>(),
    vaultParcelsWithUpgrades: new Set<string>(),
    gbmParcelsWithUpgrades: new Set<string>(),
    rafflesParcelsWithUpgrades: new Set<string>(),
    safeParcelsWithUpgrades: new Set<string>(),
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
        const category = file.includes("parcels-")
          ? file.replace("parcels-", "").replace(".json", "")
          : "normal";

        const analyticsKey =
          `${category}ParcelsWithUpgrades` as keyof UpgradeAnalytics;
        analytics[analyticsKey]?.add(parcelId);
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
    // Update final message to use same count as analytics
    const allParcelsNeedingUpgrades = new Set<string>();
    Object.values({
      "Normal addresses": latestAnalytics.normalParcelsWithUpgrades,
      "Unknown contracts": latestAnalytics.contractParcelsWithUpgrades,
      "Contracts with known owners": latestAnalytics.contractsWithOwnerUpgrades,
      Vault: latestAnalytics.vaultParcelsWithUpgrades,
      GBM: latestAnalytics.gbmParcelsWithUpgrades,
      Raffles: latestAnalytics.rafflesParcelsWithUpgrades,
      "Gnosis Safe": latestAnalytics.safeParcelsWithUpgrades,
    }).forEach((set) =>
      set.forEach((parcelId) => allParcelsNeedingUpgrades.add(parcelId))
    );
    totalProcessed = Array.from(processedUpgrades).filter((id) =>
      allParcelsNeedingUpgrades.has(id)
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
