import { Signer } from "ethers";
import { ethers, network } from "hardhat";
import { tileTypes } from "../../data/tiles/tileTypes";
import { TileFacet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

import { LedgerSigner } from "@anders-t/ethers-ledger";

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

  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  // const deployer = accounts[0];

  //mumbai address
  const diamondAddress = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  // console.log("deployer:", await deployer.getAddress());

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    diamondAddress,
    signer
  )) as TileFacet;

  if (network.name === "hardhat") {
    tileFacet = await impersonate(owner, tileFacet, ethers, network);
  }

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
