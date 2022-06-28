import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import {
  maticRealmDiamondAddress,
  maticTileDiamondAddress,
  mumbaiTileDiamondAddress,
} from "../../constants";
import { OwnershipFacet, TileFacet } from "../../typechain";
import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  pixelcraftAddress,
} from "../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  let diamondAddress = maticTileDiamondAddress;

  if (network.name === "mumbai") {
    diamondAddress = mumbaiTileDiamondAddress;
  }

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    diamondAddress
  )) as TileFacet;

  if (network.name === "hardhat") {
    tileFacet = await impersonate(owner, tileFacet, ethers, network);
  }

  await tileFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    diamondAddress,
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
