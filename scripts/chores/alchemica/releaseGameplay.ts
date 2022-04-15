import { Signer } from "ethers";
import { ethers, run } from "hardhat";

export async function setAddresses() {
  const amounts = [
    ethers.utils.parseEther("500000"),
    ethers.utils.parseEther("250000"),
    ethers.utils.parseEther("125000"),
    ethers.utils.parseEther("50000"),
  ].join(",");

  console.log("amounts:", amounts);

  await run("releaseGameplay", {
    amounts: amounts,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
