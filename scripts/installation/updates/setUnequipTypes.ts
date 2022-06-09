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

  const tx = await installationAdminFacet.editInstallationUnequipTypes(
    [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
    ],
    [
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
    ],
    { gasPrice: gasPrice }
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
