import { ethers, network } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import { goldenAltars } from "../../../data/installations/goldenAltars";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice, impersonate } from "../helperFunctions";

export async function editInstallationTypes() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress,
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

  const altars = goldenAltars.map((val) => outputInstallation(val));

  const ids = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  if (ids.length !== altars.length) {
    throw new Error("Incorrect length");
  }

  await installationFacet.editInstallationTypes(ids, altars, {
    gasPrice: gasPrice,
  });

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
  editInstallationTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
