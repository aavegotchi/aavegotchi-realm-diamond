/* global ethers hre */
/* eslint prefer-const: "off" */

import { RealmFacet } from "../../typechain";
import { maticDiamondAddress } from "../helperFunctions";

//@ts-ignore
// import hardhat, { run, ethers } from "hardhat";

import { ethers } from "hardhat";

// Init GBM
const diamondAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
const aavegotchiDiamond = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

async function getAuctionID() {
  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticDiamondAddress
  )) as RealmFacet;

  const parcel = await realmFacet.getParcelInfo("1000");

  console.log("parcel:", parcel);
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

exports.getAuctionID = getAuctionID;
