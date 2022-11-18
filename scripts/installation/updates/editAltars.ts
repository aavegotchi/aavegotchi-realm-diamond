import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/installationTypes";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";

export async function editInstallationTypes() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const c = await varsForNetwork(ethers);

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
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

  const ids = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
  ];

  const altars = [];
  ids.forEach((id) => {
    altars.push(installationTypes.find((val) => val.id.toString() === id));
  });
  if (ids.length !== altars.length) {
    throw new Error("Incorrect length");
  }

  console.log("ids:", ids);
  console.log("altars:", altars);

  console.log("Updating ");
  await installationFacet.editInstallationTypes(ids, altars, {
    gasPrice: gasPrice,
  });

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes(ids);
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
