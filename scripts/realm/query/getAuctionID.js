/* global ethers hre */
/* eslint prefer-const: "off" */

//@ts-ignore
// import hardhat, { run, ethers } from "hardhat";

const { getSelectors, FacetCutAction } = require("../libraries/diamond.js");

// Init GBM
const diamondAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
const aavegotchiDiamond = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

async function getAuctionID() {
  const settingsFacet = await ethers.getContractAt(
    "SettingsFacet",
    diamondAddress
  );
  const initiator = await settingsFacet.getInitiatorInfo();
  console.log("initiator:", initiator);

  const gbmFacet = await ethers.getContractAt("GBMFacet", diamondAddress);

  const auctionId = (
    await gbmFacet["getAuctionID(address,uint256)"](aavegotchiDiamond, "0")
  ).toString();

  console.log("auction id:", auctionId);
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
