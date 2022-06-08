import { ethers, network } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import { decorations1 } from "../../../data/installations/decorations1";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";

export async function addDecorations() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress,
    signer
  )) as InstallationAdminFacet;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    installationFacet = await impersonate(
      await diamondOwner(maticInstallationDiamondAddress, ethers),
      installationFacet,
      ethers,
      network
    );
  }

  const installationTypes = decorations1.map((val) => outputInstallation(val));

  await installationFacet.addInstallationTypes(installationTypes, {
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
  addDecorations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
