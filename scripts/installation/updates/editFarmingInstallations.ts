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
    "InstallationFacet",
    c.installationDiamond
    // signer
  )) as InstallationFacet;

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond
    // signer
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationAdminFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  // const currentInstallations = await installationFacet.getInstallationTypes([
  //   93,
  // ]);

  // console.log("current:", currentInstallations);

  const ids = [
    92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
    109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123,
    124, 125, 126, 127,
  ];

  const installationsToFix = ids.map((val) =>
    outputInstallation(installationTypesMatic.find((inst) => inst.id === val))
  );

  console.log("to fix:", installationsToFix);

  if (ids.length !== installationsToFix.length) {
    throw new Error("Incorrect length");
  }

  console.log("Updating ");
  await installationAdminFacet.editInstallationTypes(ids, installationsToFix, {
    gasPrice: gasPrice,
  });

  // const installationfacet = (await ethers.getContractAt(
  //   "InstallationFacet",
  //   c.installationDiamond
  // )) as InstallationFacet;

  // const insts = await installationfacet.getInstallationTypes([55]);
  // console.log("insts:", insts);
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
