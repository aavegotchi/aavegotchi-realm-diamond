import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/nftDisplay";
import { InstallationAdminFacet } from "../../../typechain";

import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function addFarmInstallations() {
  const c = await varsForNetwork(ethers);

  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as InstallationAdminFacet;

  let farming = installationTypes.map((val) => outputInstallation(val));

  console.log("Farming:", farming);
  const tx = await installationFacet.addInstallationTypes(farming, {
    gasPrice: gasPrice,
  });
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addFarmInstallations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
