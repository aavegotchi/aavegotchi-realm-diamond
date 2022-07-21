import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  InstallationAdminFacet,
  InstallationFacet,
  OwnershipFacet,
} from "../../../typechain";
import { gasPrice } from "../helperFunctions";

export async function setAddresses() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const c = await varsForNetwork(ethers);

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  const types = ["55"];

  const unequip = ["1"];

  console.log("lengths:", types.length, unequip.length);

  const installationfFacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;

  const type = await installationfFacet.getInstallationUnequipType("55");

  console.log("type:", type);

  // const tx = await installationAdminFacet.editInstallationUnequipTypes(
  //   types,
  //   unequip,
  //   {
  //     gasPrice: gasPrice,
  //   }
  // );

  // await tx.wait();
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
