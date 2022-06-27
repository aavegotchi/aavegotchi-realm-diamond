import { ethers, network } from "hardhat";

import { decorations1 } from "../../../data/installations/decorations1";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { Signer } from "ethers";
import { mumbaiInstallationDiamondAddress } from "../../../constants";

export async function addDecorations(diamondAddress: string, signer?: Signer) {
  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress,
    signer
  )) as InstallationAdminFacet;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    installationAdminFacet = await impersonate(
      await diamondOwner(diamondAddress, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  const installationTypes = decorations1.map((val) => outputInstallation(val));

  console.log("Adding installation types!");

  console.log("types:", installationTypes);
  let tx = await installationAdminFacet.addInstallationTypes(
    installationTypes,
    {
      gasPrice: gasPrice,
    }
  );
  console.log("hash:", tx.hash);
  await tx.wait();
  console.log("Added!");

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
  addDecorations(mumbaiInstallationDiamondAddress)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
