import { ethers } from "hardhat";
import { mumbaiInstallationDiamondAddress } from "../../../constants";
import { installationTypes } from "../../../data/installations/altars";
import { InstallationAdminFacet, InstallationFacet } from "../../../typechain";

import { outputInstallation } from "../../realm/realmHelpers";
import { gasPrice } from "../helperFunctions";
import { Signer } from "ethers";

export async function addAltars(diamondAddress: string, signer?: Signer) {
  const installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress,
    signer
  )) as InstallationAdminFacet;

  const altars = installationTypes.map((val) => outputInstallation(val));

  console.log("Adding installations");
  const tx = await installationFacet.addInstallationTypes(altars, {
    gasPrice: gasPrice,
  });
  await tx.wait();

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
  addAltars(mumbaiInstallationDiamondAddress)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
