import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/xmas";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";

export async function addDecorations() {
  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  if (network.name === "mumbai") {
    signer = await ethers.getSigners()[0];
  }

  const c = await varsForNetwork(ethers);

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    installationAdminFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  const formattedInstallations = installationTypes.map((val) =>
    outputInstallation(val)
  );

  console.log("Adding installation types!", formattedInstallations);

  // console.log("types:", installationTypes);
  let tx = await installationAdminFacet.addInstallationTypes(
    formattedInstallations,
    {
      gasPrice: gasPrice,
    }
  );
  console.log("hash:", tx.hash);
  await tx.wait();
  console.log("Added!");

  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes([]);
  console.log("insts:", insts);

  const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  await installationAdminFacet.mintInstallations([156], [25], itemManager);

  const facet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const bal = await facet.installationsBalances(itemManager);
  console.log("bal:", bal.toString());
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
