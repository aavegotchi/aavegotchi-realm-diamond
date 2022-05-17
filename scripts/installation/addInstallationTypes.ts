import { ethers } from "hardhat";
import { installationTypes } from "../../data/installations/installationTypes";
import { InstallationAdminFacet } from "../../typechain";

import { outputInstallation } from "../realm/realmHelpers";

export async function setAddresses() {
  const diamondAddress = "0xe927518d25ef44EA33b12AFF524AC236e064C35c";
  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress
  )) as InstallationAdminFacet;

  const goldenAaltar = installationTypes.map((val) => outputInstallation(val));

  await installationFacet.addInstallationTypes(goldenAaltar);
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
