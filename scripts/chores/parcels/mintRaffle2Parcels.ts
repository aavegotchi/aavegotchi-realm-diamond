//@ts-ignore
import { run } from "hardhat";
import { MintParcelsTaskArgs } from "../../tasks/mintParcels";
import { parcels } from "../../data/raffle2";
import { maticDiamondAddress } from "../helperFunctions";

export async function mintParcels() {
  const maxProcess = 30;

  const batches = Math.ceil(parcels.length / maxProcess);
  console.log("batches:", batches);

  let currentBatch = 0;

  for (let index = 0; index < batches; index++) {
    const tokenIds = parcels
      .slice(maxProcess * currentBatch, maxProcess * currentBatch + maxProcess)
      .join(",");

    const taskArgs: MintParcelsTaskArgs = {
      //Send directly to voucher conversion contract
      toAddress: "0xd5724BCA82423D5792C676cd453c1Bf66151dC04",
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
