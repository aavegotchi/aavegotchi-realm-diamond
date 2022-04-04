import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { TileFacet, OwnershipFacet } from "../../typechain";
import { TileTypeInput, TileTypeOutput } from "../../types";
import {
  aavegotchiDAOAddress,
  gasPrice,
  maticAavegotchiDiamondAddress,
  maticDiamondAddress,
  pixelcraftAddress,
} from "../helperFunctions";

function outputTile(tile: TileTypeInput): TileTypeOutput {
  if (tile.width > 64) throw new Error("Width too much");
  if (tile.height > 64) throw new Error("Height too much");

  const alchemica = tile.alchemicaCost.map((val) =>
    ethers.utils.parseEther(val.toString())
  );

  let output: TileTypeOutput = {
    deprecated: tile.deprecated,
    tileType: tile.tileType,
    width: tile.width,
    height: tile.height,
    alchemicaCost: [
      BigNumber.from(alchemica[0]),
      BigNumber.from(alchemica[1]),
      BigNumber.from(alchemica[2]),
      BigNumber.from(alchemica[3]),
    ],
    craftTime: tile.craftTime,
    name: tile.name,
  };

  return output;
}

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const diamondAddress = "";

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  console.log("deployer:", await deployer.getAddress());

  const tileFacet = (await ethers.getContractAt(
    "TileFacet",
    diamondAddress,
    deployer
  )) as TileFacet;

  // add tile data

  await tileFacet.addTileTypes([], {
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
  console.log("installations:", tiles);
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
