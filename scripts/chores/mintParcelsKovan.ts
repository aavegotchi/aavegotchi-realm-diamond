//@ts-ignore
import { run, ethers } from "hardhat";
import { MintParcelsTaskArgs } from "../../tasks/mintParcels";
import { auction1 } from "../../data/auction1";
import { kovanDiamondAddress } from "../helperFunctions";

export async function mintParcels() {
  const accounts = await ethers.getSigners();

  const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  const taskArgs: MintParcelsTaskArgs = {
    toAddress: itemManager,
    tokenIds: auction1.slice(50, 100).join(","),
    diamondAddress: kovanDiamondAddress,
  };

  await run("mintParcels", taskArgs);
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
