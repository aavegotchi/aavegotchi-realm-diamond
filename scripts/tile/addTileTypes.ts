import { ethers, network } from "hardhat";
import { tileTypes } from "../../data/tiles/tileTypes";
import { TileFacet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

import { LedgerSigner } from "@anders-t/ethers-ledger";

import { gasPrice, mumbaiTileDiamondAddress } from "../../constants";
import { outputTile } from "../realm/realmHelpers";

export async function addTileTypes() {
  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  //matic address
  let diamondAddress = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";

  if (network.name === "mumbai") {
    diamondAddress = mumbaiTileDiamondAddress;
    signer = await ethers.getSigners()[0];
  }

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    diamondAddress,
    signer
  )) as TileFacet;

  if (network.name === "hardhat") {
    tileFacet = await impersonate(owner, tileFacet, ethers, network);
  }

  // add real data
  const tilesToAdd = [outputTile(tileTypes[7])]; //.map((val) => outputTile(val));

  console.log("Adding tiles:", tilesToAdd);
  const tx = await tileFacet.addTileTypes(tilesToAdd, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  const tiles = await tileFacet.getTileTypes([]);
  console.log("tiles:", tiles);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addTileTypes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
