//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
import { AlchemicaToken } from "../../../typechain";
import { AlchemicaFacet } from "../../../typechain/AlchemicaFacet";

export async function mintTokens() {
  const accounts = await ethers.getSigners();

  const currentAccount = accounts[0].address;

  const mumbaiDeployed = "0x13fFC4d451383e2d9Bb6b38AB827D95eC551DA82";

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    mumbaiDeployed
  )) as AlchemicaFacet;

  const fudAddress = "0xdc27a8BF85508387cB8c3B97BA77f3941eDFF45f";
  const fud = (await ethers.getContractAt(
    "AlchemicaToken",
    fudAddress
  )) as AlchemicaToken;

  let balance = await fud.balanceOf(currentAccount);
  console.log("ba;:", balance.toString());

  await alchemicaFacet.testingAlchemicaFaucet(
    "0",
    ethers.utils.parseEther("100")
  );

  balance = await fud.balanceOf(currentAccount);

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
