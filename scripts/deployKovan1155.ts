/* global ethers hre */
/* eslint prefer-const: "off" */

//@ts-ignore
import hardhat, { run, ethers } from "hardhat";

const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

let testing = ["hardhat"].includes(hardhat.network.name);
let kovan = hardhat.network.name === "kovan";
let ghstAddress: string = "";
let ghst: any;
let erc1155: any;
let erc721: any;
// let erc1155Address;
let erc721address;
let diamondAddress;

if (testing) {
  ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
} else if (kovan) {
  ghstAddress = "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5";
} else {
  ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
}

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

async function deployDiamond() {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(
    contractOwner.address,
    diamondCutFacet.address
  );
  await diamond.deployed();
  diamondAddress = diamond.address;
  console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  console.log("");
  console.log("Deploying facets");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "SettingsFacet",
    "GBMFacet",
  ];
  const cut = [];
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy();
    await facet.deployed();
    console.log(`${FacetName} deployed: ${diamondInit.address}`);
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  // upgrade diamond with facets
  console.log("Diamond Cut:", cut);
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);
  let tx;
  let receipt;
  let backendSigner = new ethers.Wallet(process.env.GBM_PK); // PK should start with '0x'
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData("init", [
    contractAddresses,
    initInfo,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
  ]);
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
  console.log("Diamond cut tx: ", tx.hash);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("Completed diamond cut");

  //Deploy Auction

  console.log("Deploying Auction!");
  if (testing) {
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc721 = await ERC721Factory.deploy();
    erc721address = erc721.address;

    //Mint 10 ERC721s

    await erc721["mint()"]();
    await erc721["mint()"]();
    await erc721["mint()"]();
  } else if (kovan) {
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);
    erc721address = "0x07543dB60F19b9B48A69a7435B5648b46d4Bb58E";
  }
  //Set defaults for Matic
  else {
    erc721address = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  }

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

  return diamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployDiamond = deployDiamond;
