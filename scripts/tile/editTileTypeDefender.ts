import { ethers, network } from "hardhat";
import { tileTypes } from "../../data/tiles/tileTypes";
import { TileFacet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { TileTypeOutput } from "../../types";

import { gasPrice } from "../../constants";
import { outputTile } from "../realm/realmHelpers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";

const credentials = {
  apiKey: process.env.DEFENDER_API_KEY_MUMBAI,
  apiSecret: process.env.DEFENDER_SECRET_KEY_MUMBAI,
};
const provider = new DefenderRelayProvider(credentials);
const signer = new DefenderRelaySigner(credentials, provider, {
  speed: "fastest",
});

export async function addTileTypes() {
  //matic address
  const diamondAddress = "0xe1dDE8916c6f61429e368606a3E2dC6A02cB5127";

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

  // add real data
  const tiles: TileTypeOutput[] = [
    outputTile(tileTypes[4]),
    outputTile(tileTypes[5]),
  ];

  console.log("Editing tiles:", tiles);
  await tileFacet.editTileType(4, tiles[0]);
  await tileFacet.editTileType(5, tiles[1]);

  console.log("tiles:", await tileFacet.getTileTypes([4, 5]));
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
