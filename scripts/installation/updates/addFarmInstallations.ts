import { ethers, network } from "hardhat";
import {
  installationTypes,
  installationTypesTest,
} from "../../../data/installations/farming";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice } from "../helperFunctions";
import { getDiamondSigner } from "../../helperFunctions";
import { varsForNetwork } from "../../../constants";

export async function addFarmInstallations(test: boolean) {
  const c = await varsForNetwork(ethers);
  const signer = await getDiamondSigner(
    c.installationDiamond,
    ethers,
    network,
    true
  );

  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  let farming = [];

  if (test) {
    farming = installationTypesTest.map((val) => outputInstallation(val));
  } else {
    farming = installationTypes.map((val) => outputInstallation(val));
  }

  const tx = await installationFacet.addInstallationTypes(farming, {
    gasPrice: gasPrice,
  });
  await tx.wait();
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
