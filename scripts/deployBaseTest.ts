import { ethers } from "hardhat";
import { gasPrice } from "../constants";

async function main() {
  const Test = await ethers.getContractFactory("BatchTransferTokens");
  let test = await Test.deploy({
    gasPrice: gasPrice,
  });
  console.log("Test:", test.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
