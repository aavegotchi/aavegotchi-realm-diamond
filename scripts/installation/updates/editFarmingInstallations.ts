import { ethers, network } from "hardhat";
import { installationTypesMatic } from "../../../data/installations/farming";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";

export async function editInstallationTypes() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const c = await varsForNetwork(ethers);

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond
    // signer
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationFacet,
      ethers,
      network
    );
  }

  const altars = installationTypesMatic.map((val) => outputInstallation(val));

  //change 55 from fud harvester to fountain
  const ids: string[] = [];
  for (let index = 55; index < 137; index++) {
    ids.push(index.toString());
  }

  console.log("altars:", altars.length);
  console.log("ids:", ids.length);

  if (ids.length !== altars.length) {
    throw new Error("Incorrect length");
  }

  console.log("Updating ");
  await installationFacet.editInstallationTypes(ids, altars, {
    gasPrice: gasPrice,
  });

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes([55]);
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
