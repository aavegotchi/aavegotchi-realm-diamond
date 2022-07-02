import { ethers, run } from "hardhat";

export async function setAddresses() {
  const amounts = [
    ethers.utils.parseEther("250000"),
    ethers.utils.parseEther("125000"),
    ethers.utils.parseEther("67500"),
    ethers.utils.parseEther("25000"),
  ].join(",");

  const hotWallet3 = "0xc57Feb6d8d5EdfcCe4027C243DCEb2B51b0E318B";

  await run("batchTransferAlchemica", {
    amounts: amounts,
    wallet: hotWallet3,
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
