import { run } from "hardhat";
import { FixBuggedParcelArgs } from "../../../tasks/fixBuggedParcel";

//To be used if a user has "wrong startPosition" error

async function main() {
  const taskArgs: FixBuggedParcelArgs = {
    parcelIds: "18096",
  };

  await run("fixBuggedParcels", taskArgs);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
