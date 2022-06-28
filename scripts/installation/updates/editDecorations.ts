import { ethers, network } from "hardhat";
import {
  maticInstallationDiamondAddress,
  mumbaiInstallationDiamondAddress,
} from "../../../constants";

import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice, impersonate } from "../helperFunctions";
import { decorations1 } from "../../../data/installations/decorations1";

export async function editInstallationTypes() {
  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  let diamondAddress = maticInstallationDiamondAddress;

  if (network.name === "mumbai") {
    signer = await ethers.getSigners()[0];
    diamondAddress = mumbaiInstallationDiamondAddress;
  }

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress,
    signer
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationFacet = await impersonate(
      "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119",
      installationFacet,
      ethers,
      network
    );
  }

  const decorations = decorations1.map((val) => outputInstallation(val));

  const ids = decorations1.map((val) => val.id);

  if (ids.length !== decorations.length) {
    throw new Error("Incorrect length");
  }

  await installationFacet.editInstallationTypes(ids, decorations, {
    gasPrice: gasPrice,
  });

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes([]);
  console.log("insts:", insts);
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
