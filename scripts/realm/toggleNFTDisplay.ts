import { ethers, network } from "hardhat";
import { installationTypes } from "../../data/installations/graandFountain";
import {
  InstallationAdminFacet,
  InstallationFacet,
  NFTDisplayFacet,
} from "../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "./realmHelpers";
import { gasPrice, impersonate } from "../installation/helperFunctions";
import { varsForNetwork } from "../../constants";
import { diamondOwner } from "../helperFunctions";

export async function editInstallationTypes() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const c = await varsForNetwork(ethers);

  let nftDisplayFacet = (await ethers.getContractAt(
    "NFTDisplayFacet",
    c.realmDiamond,
    signer
  )) as NFTDisplayFacet;

  if (network.name === "hardhat") {
    nftDisplayFacet = await impersonate(
      await diamondOwner(c.realmDiamond, ethers),
      nftDisplayFacet,
      ethers,
      network
    );
  }

  const contracts = [
    "0x9f6BcC63e86D44c46e85564E9383E650dc0b56D7",
    "0xA4E3513c98b30d4D7cc578d2C328Bd550725D1D0",
  ];

  const networks = [137, 137];

  const toggle = [true, true];

  const tx = await nftDisplayFacet.toggleNftDisplayAllowed(
    contracts,
    networks,
    toggle,
    { gasPrice: gasPrice }
  );

  await tx.wait();

  console.log("Added!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  editInstallationTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
