import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying TokenDistributor contract with the account:",
    deployer.address
  );

  const TokenDistributorFactory = await ethers.getContractFactory(
    "TokenDistributor"
  );
  const tokenDistributor = await TokenDistributorFactory.deploy();

  await tokenDistributor.deployed();

  console.log("TokenDistributor deployed to:", tokenDistributor.address);
  console.log(
    "Please update this address in your tasks/distributeGhst.ts script."
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying TokenDistributor:", error);
    process.exit(1);
  });
