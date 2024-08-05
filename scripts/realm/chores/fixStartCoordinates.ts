import { ethers, network, run } from "hardhat";
import { maticRealmDiamondAddress } from "../../tile/helperFunctions";
import { RealmFacet } from "../../../typechain-types";
import { impersonate } from "../../helperFunctions";
import { FixParcelStartPositionTaskArgs } from "../../../tasks/fixParcelStartPosition";

async function main() {
  const taskArgs: FixParcelStartPositionTaskArgs = {
    parcelID: "17671",
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
