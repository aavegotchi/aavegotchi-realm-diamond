import { run } from "hardhat";
import { FixUpgradeHashesArgs } from "../../../tasks/fixUpgradeHashes";

//To be used if a parcel's installations can't be upgraded

async function main() {
  const taskArgs: FixUpgradeHashesArgs = {
    parcelIds:
      "7897,11975,13723,16464,17317,20114,21089,24153,26990,33782,41207,43104,46177",
  };

  await run("fixUpgradeHashes", taskArgs);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
