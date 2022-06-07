//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "hardhat";
import {
  DiamondCutFacet,
  DiamondInit__factory,
  TileDiamond__factory,
  OwnershipFacet,
} from "../../typechain";
import { gasPrice, maticRealmDiamondAddress } from "./helperFunctions";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";

// import {getSelectors, FacetCutAction} from '../libraries/diamond'

const { getSelectors, FacetCutAction } = require("../libraries/diamond");

const credentials = {
  apiKey: process.env.DEFENDER_API_KEY_MUMBAI,
  apiSecret: process.env.DEFENDER_SECRET_KEY_MUMBAI,
};
const provider = new DefenderRelayProvider(credentials);
const signer = new DefenderRelaySigner(credentials, provider, {
  speed: "fast",
});

export async function deployDiamondTile() {
  const deployerAddress = await signer.getAddress();
  console.log("Deployer:", deployerAddress);

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.connect(signer).deploy({
    gasPrice: gasPrice,
  });
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = (await ethers.getContractFactory(
    "TileDiamond"
  )) as TileDiamond__factory;
  const diamond = await Diamond.connect(signer).deploy(
    deployerAddress,
    diamondCutFacet.address,
    maticRealmDiamondAddress
  );
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  const DiamondInit = (await ethers.getContractFactory(
    "DiamondInit"
  )) as DiamondInit__factory;
  const diamondInit = await DiamondInit.connect(signer).deploy({
    gasPrice: gasPrice,
  });
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  console.log("");
  console.log("Deploying facets");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "TileFacet",
    "ERC1155FacetTile",
  ];
  const cut = [];
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.connect(signer).deploy({
      gasPrice: gasPrice,
    });
    await facet.deployed();
    console.log(`${FacetName} deployed: ${facet.address}`);
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  const diamondCut = (await ethers.getContractAt(
    "IDiamondCut",
    diamond.address
  )) as DiamondCutFacet;

  // call to init function
  const functionCall = diamondInit.interface.encodeFunctionData("init");
  const tx = await diamondCut
    .connect(signer)
    .diamondCut(cut, diamondInit.address, functionCall, { gasPrice: gasPrice });
  console.log("Diamond cut tx: ", tx.hash);
  const receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("Completed diamond cut");

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamond.address
  )) as OwnershipFacet;
  const diamondOwner = await ownershipFacet.owner();
  console.log("Diamond owner is:", diamondOwner);

  if (diamondOwner !== deployerAddress) {
    throw new Error(
      `Diamond owner ${diamondOwner} is not deployer address ${deployerAddress}!`
    );
  }

  return diamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamondTile()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
