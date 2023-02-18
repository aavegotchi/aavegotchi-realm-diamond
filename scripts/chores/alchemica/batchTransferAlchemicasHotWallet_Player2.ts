import { ethers, run } from "hardhat";

export async function setAddresses() {
  const amounts = [
    ethers.utils.parseEther("50000"),
    ethers.utils.parseEther("25000"),
    ethers.utils.parseEther("12500"),
    ethers.utils.parseEther("6750"),
  ].join(",");

  const wallet = "0xB22B0daC653234E753D977A381F77DEed8AB6b20";

  await run("batchTransferAlchemica", {
    amounts: amounts,
    wallet: wallet,
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
