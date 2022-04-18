/* global ethers hre */
/* eslint prefer-const: "off" */

import { AlchemicaToken, OwnershipFacet, RealmFacet } from "../../typechain";
import { alchemica, maticDiamondAddress } from "../../constants";
import { impersonate } from "../helperFunctions";

//@ts-ignore
// import hardhat, { run, ethers } from "hardhat";

import { ethers, network } from "hardhat";

export async function getAuctionID() {
  console.log("hello");

  const diamonds = [
    "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11", //realm
    "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A", //installation
    "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355", //tile
  ];
  const currentOwner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  const newOwner = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const signer = (await ethers.getSigners())[0];

  for await (const diamond of diamonds) {
    let ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamond,
      signer
    )) as OwnershipFacet;

    if (network.name === "hardhat") {
      ownershipFacet = await impersonate(
        currentOwner,
        ownershipFacet,
        ethers,
        network
      );
    }

    let owner = await ownershipFacet.owner();
    console.log("owner:", owner);

    // const tx = await ownershipFacet.transferOwnership(newOwner);
    // await tx.wait();

    // owner = await ownershipFacet.owner();
    // console.log("owner:", owner);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  getAuctionID()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
