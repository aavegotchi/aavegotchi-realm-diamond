import { ethers, network } from "hardhat";
import { tileTypes } from "../../data/tiles/tileTypes";
import { TileFacet, OwnershipFacet } from "../../typechain";
import { diamondOwner, impersonate } from "../helperFunctions";

import { gasPrice, varsForNetwork } from "../../constants";
import { outputTile } from "../realm/realmHelpers";
import { LedgerSigner } from "@anders-t/ethers-ledger";

export async function setAddresses() {
  const c = await varsForNetwork(ethers);
  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    c.tileDiamond,
    signer
  )) as TileFacet;

  if (network.name === "hardhat") {
    tileFacet = await impersonate(
      await diamondOwner(c.tileDiamond, ethers),
      tileFacet,
      ethers,
      network
    );
  }

  // godlike rug
  const tile = outputTile(tileTypes[7]);

  console.log("Adding tile:", tile);
  await tileFacet.addTileTypes([tile], {
    gasPrice: gasPrice,
  });

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
