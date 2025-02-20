import { ethers } from "hardhat";
import { InstallationUpgradeFacet } from "../typechain-types";
import { PARCELS_FILE, ParcelIO } from "./getParcelData";

import fs from "fs";
import { varsForNetwork } from "../constants";

async function main() {
  const parcels = await fs.readFileSync(PARCELS_FILE, "utf8");

  const parcelsJson = JSON.parse(parcels) as Record<string, ParcelIO>;

  const parcelsWithUpgrades = Object.entries(parcelsJson).filter(
    //@ts-ignore
    ([parcelId, parcelData]) => Number(parcelData.upgradeQueueLength.hex) > 0
  );

  const parcelIdsWithUpgrades = parcelsWithUpgrades.map(
    ([parcelId]) => parcelId
  );

  console.log(`found ${parcelIdsWithUpgrades.length} parcels with upgrades`);

  const c = await varsForNetwork(ethers);

  //loop through and only settle 2 parcels at a time
  const installationUpgrade = (await ethers.getContractAt(
    "InstallationUpgradeFacet",
    c.installationDiamond
  )) as InstallationUpgradeFacet;

  for (let i = 0; i < parcelIdsWithUpgrades.length; i += 2) {
    let tx = await installationUpgrade.finalizeUpgradesForParcels([
      parcelIdsWithUpgrades[i],
      parcelIdsWithUpgrades[i + 1],
    ]);

    await tx.wait();
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
