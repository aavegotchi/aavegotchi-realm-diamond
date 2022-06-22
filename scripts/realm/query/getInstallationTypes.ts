//@ts-ignore

import { run, ethers, network } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import { InstallationFacet } from "../../../typechain";

async function addInstallations() {
  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
  )) as InstallationFacet;

  const types = await installationFacet.getInstallationTypes([]);
  for (let index = 0; index < types.length; index++) {
    const unequip = await installationFacet.getInstallationUnequipType(index);
    console.log("unequip:", index, unequip);
  }

  // const account = await signer.getAddress();

  // console.log("Signer:", account);

  // const tokens = [fudAddress, fomoAddress, alphaAddress, kekAddress];

  // const alchemicaFacet = await ethers.getContractAt(
  //   "AlchemicaFacet",
  //   realmDiamondAddress(network.name)
  // );

  // // await faucetAlchemica(alchemicaFacet, "10000");

  // for (let index = 0; index < tokens.length; index++) {
  //   const token = tokens[index];
  //   const tokenContract = (await ethers.getContractAt(
  //     "AlchemicaToken",
  //     token,
  //     signer
  //   )) as AlchemicaToken;

  //   const balance = await tokenContract.balanceOf(account);
  //   const allowance = await tokenContract.allowance(account, diamondAddress);
  //   console.log("Balance:", balance.toString());
  //   console.log("Allowance:", allowance.toString());

  //   // const tx = await tokenContract.approve(
  //   //   diamondAddress,
  //   //   ethers.utils.parseEther("100")
  //   // );
  //   // await tx.wait();
  //   console.log("Approved token");
  // }

  // const realmDiamond = (await ethers.getContractAt(
  //   "AlchemicaFacet",
  //   realmDiamondAddress(network.name)
  // )) as AlchemicaFacet;

  // // console.log("realm diamond:", realmDiamondAddress(network.name));

  // // const alchemicaAddresses = await realmDiamond.getAlchemicaAddresses();
  // // console.log("addresses:", alchemicaAddresses);

  // await installationFacet.craftInstallations([0]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addInstallations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
