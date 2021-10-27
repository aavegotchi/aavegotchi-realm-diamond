//@ts-ignore
import { run, ethers } from "hardhat";
import { MintParcelsTaskArgs } from "../../tasks/mintParcels";
import { auction1 } from "../../data/auction1";
import { kovanDiamondAddress } from "../helperFunctions";

export async function mintParcels() {
  const itemManager = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  const tokenIds = auction1.slice(0, 50).join(",");

  const taskArgs: MintParcelsTaskArgs = {
    toAddress: itemManager,
    tokenIds: tokenIds,
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
