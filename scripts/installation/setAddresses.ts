import { ethers, network } from "hardhat";

import { InstallationAdminFacet, OwnershipFacet } from "../../typechain";

import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  maticDiamondAddress,
  pixelcraftAddress,
} from "../helperFunctions";

export async function setAddresses() {
  const diamondAddress = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress
  )) as InstallationAdminFacet;

  installationAdminFacet = await impersonate(
    owner,
    installationAdminFacet,
    ethers,
    network
  );

  await installationAdminFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    maticDiamondAddress,
    ethers.constants.AddressZero,
    pixelcraftAddress,
    aavegotchiDAOAddress
  );
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