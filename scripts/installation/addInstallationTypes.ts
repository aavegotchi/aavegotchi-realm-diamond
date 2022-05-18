import { ethers } from "hardhat";
import { maticInstallationDiamondAddress } from "../../constants";
import { installationTypes } from "../../data/installations/altars";
import { InstallationAdminFacet, InstallationFacet } from "../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../realm/realmHelpers";
import { gasPrice } from "./helperFunctions";

export async function setAddresses() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress,
    signer
  )) as InstallationAdminFacet;

  const altars = installationTypes.map((val) => outputInstallation(val));

  await installationFacet.addInstallationTypes(altars, { gasPrice: gasPrice });

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
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
