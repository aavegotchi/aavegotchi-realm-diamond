import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/nftDisplay_big";
import { InstallationAdminFacet } from "../../../typechain";

import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function addInstallations() {
  const c = await varsForNetwork(ethers);

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationFacet,
      ethers,
      network
    );
  } else if (network.name === "mumbai") {
    installationFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      c.installationDiamond,
      (
        await ethers.getSigners()
      )[0]
    )) as InstallationAdminFacet;
  }

  let installations = installationTypes.map((val) => outputInstallation(val));

  console.log("NFT displays:", installations);
  const tx = await installationFacet.addInstallationTypes(installations, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  console.log("Successfully added!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addInstallations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
