import { ethers, network } from "hardhat";
import {
  maticInstallationDiamondAddress,
  mumbaiInstallationDiamondAddress,
} from "../../../constants";
import { installationTypes } from "../../../data/installations/altars";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice } from "../helperFunctions";
import { Signer } from "ethers";

export async function setAddresses() {
  let signer: LedgerSigner | Signer = new LedgerSigner(
    ethers.provider,
    "m/44'/60'/2'/0/0"
  );
  let diamondAddress = maticInstallationDiamondAddress;

  if (network.name === "mumbai") {
    signer = (await ethers.getSigners())[0];
    diamondAddress = mumbaiInstallationDiamondAddress;
  }

  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress,
    signer
  )) as InstallationAdminFacet;

  const altars = installationTypes.map((val) => outputInstallation(val));

  console.log("Adding installations");
  const tx = await installationFacet.addInstallationTypes(altars, {
    gasPrice: gasPrice,
  });
  await tx.wait();

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
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
