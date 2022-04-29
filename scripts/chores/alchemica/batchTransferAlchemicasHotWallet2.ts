import { ethers, run } from "hardhat";

export async function setAddresses() {
  const amounts = [
    ethers.utils.parseEther("250000"),
    ethers.utils.parseEther("125000"),
    ethers.utils.parseEther("67500"),
    ethers.utils.parseEther("25000"),
  ].join(",");

  const hotWallet2 = "0xa0f32863AC0e82d36Df959A95FeDb661C1d32A6f";

  await run("batchTransferAlchemica", {
    amounts: amounts,
    wallet: hotWallet2,
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
