//@ts-ignore

import { Signer } from "ethers";
import hardhat, { run, ethers, network } from "hardhat";
import {
  AlchemicaFacet,
  AlchemicaToken,
  InstallationAdminFacet,
  InstallationFacet,
  OwnershipFacet,
} from "../../../typechain";

import {
  installationDiamondAddress,
  realmDiamondAddress,
} from "../../helperFunctions";

const gasPrice = 20000000000;

async function addInstallations() {
  const accounts = await ethers.getSigners();

  const diamondAddress = installationDiamondAddress(network.name);

  console.log("diamond address:", diamondAddress);

  //transfer ownership to multisig
  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;

  let currentOwner = await ownershipFacet.owner();

  console.log("Current owner is:", currentOwner);
  let signer: Signer;

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (
    hardhat.network.name === "matic" ||
    hardhat.network.name === "mumbai"
  ) {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress,
    signer
  )) as InstallationFacet;

  const types = await installationFacet.getInstallationTypes([0]);

  console.log("types:", types);

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
