import { ethers, network } from "hardhat";
import { InstallationAdminFacet } from "../../../typechain-types";

import { diamondOwner, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function disableUpgrades() {
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
  }

  let tx = await installationFacet.toggleUpgradePaused();
  console.log("tx:", tx.hash);
  await tx.wait();

  console.log("Installation upgrades paused");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  disableUpgrades()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
