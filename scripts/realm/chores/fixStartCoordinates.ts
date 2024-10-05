import { ethers, network, run } from "hardhat";
import { maticRealmDiamondAddress } from "../../tile/helperFunctions";
import { RealmFacet } from "../../../typechain-types";
import { impersonate } from "../../helperFunctions";
import { FixParcelStartPositionTaskArgs } from "../../../tasks/fixParcelStartPosition";

async function main() {
  const realmGridFacet = await ethers.getContractAt(
    "RealmGridFacet",
    maticRealmDiamondAddress
  );

  //lvl1 aaltar in middle
  const parcelId = "17671";
  const x = 3;
  const y = 3;
  const isTile = false;
  const id = 10;

  // Check before fix
  const beforeFix = await realmGridFacet.isGridStartPosition(
    parcelId,
    x,
    y,
    isTile,
    id
  );
  console.log(`Before fix: ${beforeFix.toString()}`);

  // Perform the fix
  const taskArgs: FixParcelStartPositionTaskArgs = {
    parcelID: parcelId,
    updateInstallation: true,
    updateTiles: false,
  };
  await run("fixParcelStartPosition", taskArgs);

  // Check after fix
  const afterFix = await realmGridFacet.isGridStartPosition(
    parcelId,
    x,
    y,
    isTile,
    id
  );
  console.log(`After fix: ${afterFix.toString()}`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
