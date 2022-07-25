import { run } from "hardhat";
import { FixParcelStartPositionTaskArgs } from "../../../tasks/fixParcelStartPosition";

//To be used if a user has "wrong startPosition" error

async function main() {
  const taskArgs: FixParcelStartPositionTaskArgs = {
    parcelID: "6349",
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
