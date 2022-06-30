//@ts-ignore
import * as hre from "hardhat";

import { run, ethers, network } from "hardhat";
import { Signer } from "ethers";
import {
  VRFFacet,
  RealmFacet,
  OwnershipFacet,
  AlchemicaFacet,
} from "../../../typechain";
import { InstallationTypeInput } from "../../../types";
import {
  mumbaiDiamondAddress,
  maticRealmDiamondAddress,
} from "../../../constants";
import { alchemicaTotals } from "../../setVars";

async function setHaarvesterVars() {
  const accounts = await ethers.getSigners();
  const testing = ["hardhat", "localhost"].includes(hre.network.name);
  let diamondAddress: string;

  diamondAddress = maticRealmDiamondAddress;

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

  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    diamondAddress,
    signer
  )) as RealmFacet;

  const vrfFacet = (await ethers.getContractAt(
    "VRFFacet",
    diamondAddress,
    signer
  )) as VRFFacet;

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    diamondAddress,
    signer
  )) as AlchemicaFacet;

  console.log("Set VRF Coordinator");
  let tx = await vrfFacet.setVrfCoordinator(
    "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed"
  );
  await tx.wait();
  console.log("Set VRF Config");
  tx = await vrfFacet.setConfig({
    subId: 900,
    callbackGasLimit: 100_000,
    requestConfirmations: 10,
    numWords: 4,
    keyHash:
      "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
  });

  await tx.wait();

  console.log("Set Alchemica totals");

  //@ts-ignore
  tx = await alchemicaFacet.setTotalAlchemicas(alchemicaTotals());
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
