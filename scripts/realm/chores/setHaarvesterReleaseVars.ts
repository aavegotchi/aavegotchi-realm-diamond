//@ts-ignore
import * as hre from "hardhat";

import { ethers } from "hardhat";
import { Signer } from "ethers";
import { OwnershipFacet, AlchemicaFacet } from "../../../typechain";

import { alchemicaTotals } from "../../setVars";
import { varsForNetwork } from "../../../constants";

async function setHaarvesterVars() {
  const accounts = await ethers.getSigners();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  const c = await varsForNetwork(ethers);
  let diamondAddress: string = c.realmDiamond;

  //transfer ownership to multisig
  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;

  let currentOwner = await ownershipFacet.owner();

  console.log("Current owner is:", currentOwner);
  let signer: Signer;

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (hre.network.name === "matic" || hre.network.name === "mumbai") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    diamondAddress,
    signer
  )) as AlchemicaFacet;

  console.log("Set Alchemica totals");

  //@ts-ignore
  let tx = await alchemicaFacet.setTotalAlchemicas(alchemicaTotals());
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setHaarvesterVars()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
