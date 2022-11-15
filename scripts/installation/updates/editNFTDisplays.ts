import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/nftDisplay";
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

  const displays = installationTypes
    .slice(4, 8)
    .map((val) => outputInstallation(val));

  console.log("displays:", displays);

  const ids = ["141", "142", "143", "144"];

  if (ids.length !== displays.length) {
    throw new Error("Incorrect length");
  }

  console.log("Updating ");
  const tx = await installationFacet.editInstallationTypes(ids, displays, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes([
    141, 142, 143, 144,
  ]);
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
