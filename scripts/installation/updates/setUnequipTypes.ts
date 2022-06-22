import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";

import { InstallationAdminFacet, OwnershipFacet } from "../../../typechain";
import { gasPrice } from "../helperFunctions";

export async function setAddresses() {
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress,
    signer
  )) as InstallationAdminFacet;

  const types = [
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "50",
    "51",
    "52",
    "53",
    "54",
  ];

  const unequip = [
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
    "1",
  ];

  console.log("lengths:", types.length, unequip.length);

  const tx = await installationAdminFacet.editInstallationUnequipTypes(
    types,
    unequip,
    {
      gasPrice: gasPrice,
    }
  );

  await tx.wait();

  console.log("types set");
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
