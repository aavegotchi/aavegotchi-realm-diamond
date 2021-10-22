//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { MintParcelsTaskArgs } from "../../tasks/mintParcels";
import { auction1 } from "../../data/auction1";
import { deployDiamond } from "../deploy";
import { maticDiamondAddress } from "../helperFunctions";

export async function mintParcels() {
  const accounts = await ethers.getSigners();

  const taskArgs: MintParcelsTaskArgs = {
    toAddress: accounts[0].address,
    tokenIds: auction1.slice(0, 100).join(","),
    diamondAddress: maticDiamondAddress,
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
