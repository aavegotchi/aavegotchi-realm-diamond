//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { AlchemicaToken } from "../../../typechain";
import { AlchemicaFacet } from "../../../typechain/AlchemicaFacet";

export async function mintTokens() {
  const accounts = await ethers.getSigners();

  const currentAccount = accounts[0].address;

  const mumbaiDeployed = "0x8b055a69EBE80388937eF947B495a04F50aAf094";

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    mumbaiDeployed
  )) as AlchemicaFacet;

  const fudAddress = "0xdc20b206Fb31159a8c09C0497A7e0356D424678a";
  const fud = (await ethers.getContractAt(
    "AlchemicaToken",
    fudAddress
  )) as AlchemicaToken;

  let balance = await fud.balanceOf(currentAccount);
  console.log("ba;:", balance.toString());

  //   await alchemicaFacet.testingAlchemicaFaucet(
  //     "0",
  //     ethers.utils.parseEther("100")
  //   );

  //   balance = await fud.balanceOf(currentAccount);

  const owner = await fud.owner();
  console.log("owner:", owner);

  console.log("ba;:", balance.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  mintTokens()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
