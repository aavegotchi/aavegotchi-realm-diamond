import { ethers, run } from "hardhat";

export async function setAddresses() {
  const amounts = [
    ethers.utils.parseEther("250000"),
    ethers.utils.parseEther("125000"),
    ethers.utils.parseEther("67500"),
    ethers.utils.parseEther("25000"),
  ].join(",");

  const withdrawWallet = "0xb22b0dac653234e753d977a381f77deed8ab6b20";

  await run("batchTransferAlchemica", {
    amounts: amounts,
    wallet: withdrawWallet,
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
