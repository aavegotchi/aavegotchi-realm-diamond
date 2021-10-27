//@ts-ignore
import { run, ethers } from "hardhat";
import { MintParcelsTaskArgs } from "../../tasks/mintParcels";
import { auction1 } from "../../data/auction1";
import { maticDiamondAddress } from "../helperFunctions";
import { Signer } from "@ethersproject/abstract-signer";

export async function mintParcels() {
  const accounts: Signer[] = await ethers.getSigners();

  console.log("to:", await accounts[0].getAddress());
  const to = await accounts[0].getAddress();

  const tokenIds = auction1.slice(0, 100).join(",");

  const taskArgs: MintParcelsTaskArgs = {
    toAddress: to,
    tokenIds: tokenIds,
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
