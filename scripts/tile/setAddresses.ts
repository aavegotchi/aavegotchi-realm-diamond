import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import {
  maticRealmDiamondAddress,
  maticTileDiamondAddress,
  mumbaiRealmDiamondAddress,
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

  let realmAddress = mumbaiRealmDiamondAddress;
  let tileAddress = mumbaiTileDiamondAddress;

  if (network.name === "mumbai") {
    realmAddress = maticRealmDiamondAddress;
    tileAddress = mumbaiTileDiamondAddress;
  }

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    tileAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    tileAddress
  )) as TileFacet;

  if (network.name === "hardhat") {
    tileFacet = await impersonate(owner, tileFacet, ethers, network);
  }

  await tileFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    realmAddress,
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
