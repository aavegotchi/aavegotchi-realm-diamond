/* global ethers hre */
/* eslint prefer-const: "off" */

//@ts-ignore
// import hardhat, { run, ethers } from "hardhat";

import { ethers } from "hardhat";
import { maticRealmDiamondAddress } from "../../tile/helperFunctions";
import { RealmGettersAndSettersFacet } from "../../../typechain-types";

async function getAuctionID() {
  const realmFacet = (await ethers.getContractAt(
    "RealmGettersAndSettersFacet",
    maticRealmDiamondAddress
  )) as RealmGettersAndSettersFacet;

  const parcel = await realmFacet.getParcelInfo("15726");

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
