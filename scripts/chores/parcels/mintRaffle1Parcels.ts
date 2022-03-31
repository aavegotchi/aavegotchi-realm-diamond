//@ts-ignore
import { run, ethers } from "hardhat";
import { MintParcelsTaskArgs } from "../../tasks/mintParcels";
import { raffle1 } from "../../data/raffle1";
import { maticDiamondAddress } from "../helperFunctions";

export async function mintParcels() {
  const maxProcess = 5;

  const batches = Math.ceil(raffle1.length / maxProcess);
  console.log("batches:", batches);

  let currentBatch = 0;

  for (let index = 0; index < batches; index++) {
    const tokenIds = raffle1
      .slice(maxProcess * currentBatch, maxProcess * currentBatch + maxProcess)
      .join(",");

    const taskArgs: MintParcelsTaskArgs = {
      //Send directly to voucher conversion contract
      toAddress: "0x038d7eD80A500D2D181f67fd0DF60c57628Dcc7C",
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
