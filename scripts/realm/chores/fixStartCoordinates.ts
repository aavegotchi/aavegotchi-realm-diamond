import { run } from "hardhat";

import { FixParcelStartPositionTaskArgs } from "../../../tasks/fixParcelStartPosition";

async function main() {
  const taskArgs: FixParcelStartPositionTaskArgs = {
    parcelID: "14522",
    updateInstallation: true,
    updateTiles: false,
  };

  await run("fixParcelStartPosition", taskArgs);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
