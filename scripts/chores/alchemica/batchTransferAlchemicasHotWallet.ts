import { ethers, network, run } from "hardhat";

export async function setAddresses() {
  const amounts = [
    ethers.utils.parseEther("500000"),
    ethers.utils.parseEther("250000"),
    ethers.utils.parseEther("125000"),
    ethers.utils.parseEther("0"),
  ].join(",");

  const hotWallet1 = "0x2c1a288353e136b9e4b467aadb307133fffeab25";

  await run("batchTransferAlchemica", {
    amounts: amounts,
    wallet: hotWallet1,
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
