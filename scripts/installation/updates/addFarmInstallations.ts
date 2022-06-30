import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/farming";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice } from "../helperFunctions";
import {
  maticInstallationDiamondAddress,
  mumbaiInstallationDiamondAddress,
} from "../../../constants";

export async function setAddresses() {
  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  if (network.name === "mumbai") {
    signer = await ethers.getSigners()[0];
  }

  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    mumbaiInstallationDiamondAddress,
    signer
  )) as InstallationAdminFacet;

  const farming = installationTypes.map((val) => outputInstallation(val));

  console.log("farming:", farming);

  // await installationFacet.addInstallationTypes(farming, { gasPrice: gasPrice });

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    mumbaiInstallationDiamondAddress
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes([]);
  console.log("insts:", insts);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
