//@ts-ignore

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import {
  maticRealmDiamondAddress,
  mumbaiDiamondAddress,
} from "../../../constants";
import { RealmFacet } from "../../../typechain";

async function setGameActive() {
  const accounts = await ethers.getSigners();

  let signer: Signer | LedgerSigner;

  let diamondAddress: string = "";

  if (network.name === "matic") {
    diamondAddress = maticRealmDiamondAddress;
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  } else if (network.name === "mumbai") {
    diamondAddress = mumbaiDiamondAddress;
    signer = accounts[0];
  } else {
    diamondAddress = maticRealmDiamondAddress;
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  }

  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    diamondAddress,
    signer
  )) as RealmFacet;

  const types = await realmFacet.setGameActive(true);

  console.log("types:", types);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setGameActive()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
