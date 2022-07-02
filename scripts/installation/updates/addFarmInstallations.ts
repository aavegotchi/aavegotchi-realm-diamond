import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/farming";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice } from "../helperFunctions";
import { getDiamondSigner } from "../../helperFunctions";
import { varsForNetwork } from "../../../constants";

export async function addFarmInstallations() {
  const c = await varsForNetwork(ethers);
  const signer = await getDiamondSigner(
    c.installationDiamond,
    ethers,
    network.name,
    true
  );

  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  const farming = installationTypes.map((val) => outputInstallation(val));

  const tx = await installationFacet.addInstallationTypes(farming, {
    gasPrice: gasPrice,
  });
  await tx.wait();
  const installationfacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const insts = await installationfacet.getInstallationTypes([]);
  console.log("insts:", insts);
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
