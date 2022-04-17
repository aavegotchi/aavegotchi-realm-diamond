import { Signer } from "ethers";
import { ethers } from "hardhat";
import { tileTypes } from "../../data/tiles/tileTypes";
import { TileFacet, OwnershipFacet } from "../../typechain";

import {
  aavegotchiDAOAddress,
  gasPrice,
  maticAavegotchiDiamondAddress,
  maticDiamondAddress,
  pixelcraftAddress,
} from "../../constants";
import { outputTile } from "./helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  //mumbai address
  const diamondAddress = "0x0aB1547B21D81eB3af1712c0BD8ac21c0c1219a9";

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  // console.log("deployer:", await deployer.getAddress());

  const tileFacet = (await ethers.getContractAt(
    "TileFacet",
    diamondAddress,
    deployer
  )) as TileFacet;

  // add real data
  const goldenTiles = tileTypes.map((val) => outputTile(val, ethers));

  await tileFacet.addTileTypes(goldenTiles, {
    gasPrice: gasPrice,
  });

  await tileFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    maticDiamondAddress,
    ethers.constants.AddressZero,
    pixelcraftAddress,
    aavegotchiDAOAddress,
    { gasPrice: gasPrice }
  );

  const tiles = await tileFacet.getTileTypes([]);
  console.log("tiles:", tiles);
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
