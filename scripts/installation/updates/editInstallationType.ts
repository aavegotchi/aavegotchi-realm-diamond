import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/nftDisplay_big";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";
import { Signer } from "ethers";

export async function editInstallationTypes() {
  let signer: LedgerSigner | Signer = new LedgerSigner(
    ethers.provider,
    "m/44'/60'/2'/0/0"
  );

  if (network.name === "mumbai") {
    signer = await (await ethers.getSigners())[0];
  }

  const c = await varsForNetwork(ethers);

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationFacet,
      ethers,
      network
    );
  }

  const installations = installationTypes.map((val) => outputInstallation(val));

  const ids = [157, 158, 159, 160, 161];

  console.log("Updating ");
  const tx = await installationFacet.editInstallationTypes(ids, installations, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes(ids);
  console.log(
    "insts:",
    insts.map((val) => val.installationType)
  );
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
