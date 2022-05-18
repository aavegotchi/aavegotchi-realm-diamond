import { ethers, network } from "hardhat";
import { tileTypes } from "../../data/tiles/tileTypes";
import { TileFacet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

import { LedgerSigner } from "@anders-t/ethers-ledger";

import { gasPrice } from "../../constants";
import { outputTile } from "../realm/realmHelpers";

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

  const tile = outputTile({
    id: 3,
    name: "LE Golden Tile - Gotchi",
    width: 8,
    height: 8,
    deprecated: false,
    tileType: 0,
    alchemicaCost: ["25", "25", "75", "25"],
    craftTime: 0,
  });

  console.log("Editing tile:", tile);
  await tileFacet.editTileType("3", tile, {
    gasPrice: gasPrice,
  });

  console.log("Set deprecate time to:", new Date(1654092000 * 1000));
  const tx = await tileFacet.editDeprecateTime("3", "1654092000", {
    gasPrice: gasPrice,
  });

  await tx.wait();
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
