import { ethers, network } from "hardhat";
import { TileFacet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

import { LedgerSigner } from "@anders-t/ethers-ledger";

import { gasPrice } from "../../constants";
import { outputTile } from "../realm/realmHelpers";
import { tileTypes } from "../../data/tiles/tileTypes";

export async function setAddresses() {
  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  //matic address
  const diamondAddress = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";

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

  let tiles = tileTypes.map((val) => outputTile(val));
  // console.log("tile:", tile);
  const ids = tileTypes.map((val) => val.id);

  console.log("Editing tile:", tiles);
  console.log("ids:", ids);
  const tx = await tileFacet.editTileTypes(ids, tiles, {
    gasPrice: gasPrice,
  });

  // console.log("Set deprecate time to:", new Date(1));
  // const tx = await tileFacet.editDeprecateTime("2", "1", {
  //   gasPrice: gasPrice,
  // });

  await tx.wait();
  const afterTiles = await tileFacet.getTileTypes([]);
  console.log("tiles:", afterTiles);
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
