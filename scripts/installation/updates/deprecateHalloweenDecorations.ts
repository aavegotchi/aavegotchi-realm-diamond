import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/halloween";
import { InstallationAdminFacet } from "../../../typechain";

import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function addFarmInstallations(test: boolean) {
  const c = await varsForNetwork(ethers);

  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  if (network.name === "mumbai") {
    signer = await ethers.getSigners()[0];
  }

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationAdminFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  let installations = installationTypes.map((val) => outputInstallation(val));

  const ids = [146, 147, 148, 149, 150, 151];

  console.log("Installations:", installations);
  const tx = await installationAdminFacet.editInstallationTypes(
    ids,
    installations,
    {
      gasPrice: gasPrice,
    }
  );
  await tx.wait();

  const installationFacet = await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  );

  const after = await installationFacet.getInstallationTypes(ids);
  console.log("after:", after);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addFarmInstallations(false)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
