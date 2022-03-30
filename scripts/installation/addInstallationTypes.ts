import { ethers } from "hardhat";
import { installationTypes } from "../../data/installations/installationTypes";
import { InstallationAdminFacet, InstallationFacet } from "../../typechain";

import { outputInstallation } from "../realm/realmHelpers";

export async function setAddresses() {
  const diamondAddress = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";
  const installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress
  )) as InstallationAdminFacet;

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress
  )) as InstallationFacet;

  const goldenAaltar = installationTypes.map((val) => outputInstallation(val));

  await installationAdminFacet.addInstallationTypes(goldenAaltar);

  const installations = await installationFacet.getInstallationTypes([]);

  console.log("instsllations:", installations);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
