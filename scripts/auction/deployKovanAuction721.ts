/* global ethers hre */
/* eslint prefer-const: "off" */

//@ts-ignore
import hardhat, { run, ethers } from "hardhat";

const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

let testing = ["hardhat"].includes(hardhat.network.name);
let kovan = hardhat.network.name === "kovan";
let ghstAddress: string = "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5";
let ghst: any;
let erc1155: any;
let erc721: any;
// let erc1155Address;
let erc721address;
let diamondAddress = "0x6d96b9019A5F468Efafff4b1126F154CF816F279";

// Init GBM

const pixelcraft = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
const playerRewards = "0x27DF5C6dcd360f372e23d5e63645eC0072D0C098";
const daoTreasury = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

let startTime = Math.floor(Date.now() / 1000);
let endTime = Math.floor(Date.now() / 1000) + 86400;
let hammerTimeDuration = 300;
let bidDecimals = 100000;
let stepMin = 10000;
let incMax = 10000;
let incMin = 1000;
let bidMultiplier = 11120;

const contractAddresses = {
  erc20Currency: ghstAddress,
  pixelcraft,
  playerRewards,
  daoTreasury,
};

const initInfo = {
  startTime,
  endTime,
  hammerTimeDuration,
  bidDecimals,
  stepMin,
  incMax,
  incMin,
  bidMultiplier,
};

async function deployAuction() {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  //Deploy Auction

  console.log("Deploying Auction!");

  ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);
  erc721address = "0x07543dB60F19b9B48A69a7435B5648b46d4Bb58E";

  const gbmFacet = await ethers.getContractAt(
    "GBMFacet",
    diamondAddress,
    accounts[0]
  );

  if (erc721) {
    console.log("Mass registering");
    await erc721.setApprovalForAll(diamondAddress, true);
    await gbmFacet.registerMassERC721Each(
      diamondAddress,
      true,
      erc721address,
      "0",
      "3"
    );
  }

  const auctionId = (
    await gbmFacet["getAuctionID(address,uint256)"](erc721address, "0")
  ).toString();

  const auctionInfo = await gbmFacet.getAuctionInfo(auctionId);
  console.log("auction info:", auctionInfo);

  const ownershipFacet = await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  );

  await ownershipFacet.transferOwnership(
    "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c"
  );

  const diamondOwner = await ownershipFacet.owner();

  console.log("diamond owner:", diamondOwner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployAuction()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployDiamond = deployAuction;
