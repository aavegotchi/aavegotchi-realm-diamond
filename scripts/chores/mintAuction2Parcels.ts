//@ts-ignore
import { run } from "hardhat";
import { MintParcelsTaskArgs } from "../../tasks/mintParcels";
import { parcels } from "../../data/auction2";
import { maticDiamondAddress } from "../helperFunctions";

export async function mintParcels() {
  const maxProcess = 50;

  const batches = Math.ceil(parcels.length / maxProcess);
  console.log("batches:", batches);

  let currentBatch = 0;

  for (let index = 0; index < batches; index++) {
    const tokenIds = parcels
      .slice(maxProcess * currentBatch, maxProcess * currentBatch + maxProcess)
      .join(",");

    const taskArgs: MintParcelsTaskArgs = {
      toAddress: "0x94cb5C277FCC64C274Bd30847f0821077B231022",
      tokenIds: tokenIds,
      diamondAddress: maticDiamondAddress,
    };

    await run("mintParcels", taskArgs);

    currentBatch++;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  mintParcels()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
