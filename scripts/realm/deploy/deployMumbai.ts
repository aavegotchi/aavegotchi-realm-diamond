//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers, network } from "hardhat";
import {
  DiamondCutFacet,
  DiamondInit__factory,
  Diamond__factory,
  OwnershipFacet,
  AlchemicaFacet,
  AlchemicaToken,
} from "../../../typechain";
import { gasPrice, impersonate } from "../../helperFunctions";
import { deployAlchemica } from "../realmHelpers";
import { alchemicaTotals, boostMultipliers } from "../../setVars";
import { deployDiamond } from "../../installation/deploy";
import { deployDiamondTile } from "../../tile/deploy";

const { getSelectors, FacetCutAction } = require("../../libraries/diamond.js");

interface Diamond {
  address: string;
}

async function deployRealmDiamond(deployerAddress: string) {
  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");

  const gasData = await ethers.provider.getFeeData();

  console.log("gas data:", gasData);

  console.log("Deploying diamond cut facet:");
  const diamondCutFacet = await DiamondCutFacet.deploy({
    gasPrice: gasData.gasPrice ? gasData.gasPrice : gasPrice,
    // maxFeePerGas: gasData.maxFeePerGas ? gasData.maxFeePerGas : "10000",
    // maxPriorityFeePerGas: gasData.maxPriorityFeePerGas
    // ? gasData.maxPriorityFeePerGas
    // : "10000",
  });
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = (await ethers.getContractFactory(
    "Diamond"
  )) as Diamond__factory;
  const diamond = await Diamond.deploy(
    deployerAddress,
    diamondCutFacet.address,
    { gasPrice: gasPrice }
  );
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  const DiamondInit = (await ethers.getContractFactory(
    "DiamondInit"
  )) as DiamondInit__factory;
  const diamondInit = await DiamondInit.deploy({ gasPrice: gasPrice });
  await diamondInit.deployed();
  console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  console.log("");
  console.log("Deploying facets");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "ERC721Facet",
    "RealmFacet",
    "AlchemicaFacet",
    "VRFFacet",
  ];
  const cut = [];
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy({
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
  const tx = await diamondCut.diamondCut(
    cut,
    diamondInit.address,
    functionCall,
    { gasPrice: gasPrice }
  );
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

  return diamond as Diamond;
}

export async function deployMumbai() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  console.log("nonce:", await deployer.getTransactionCount());

  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);

  console.log("Deploying Realm Diamond");
  const realmDiamond = await deployRealmDiamond(deployerAddress);

  console.log("Deploying Installation Diamond");
  const installationDiamond = await deployDiamond();

  const tileDiamond = await deployDiamondTile();

  console.log("Deploying Alchemicas");
  const alchemica = await deployAlchemica(ethers, realmDiamond.address);

  const greatPortalCapacity: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [
    ethers.utils.parseUnits("1250000000"),
    ethers.utils.parseUnits("625000000"),
    ethers.utils.parseUnits("312500000"),
    ethers.utils.parseUnits("125000000"),
  ];

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    realmDiamond.address
  )) as AlchemicaFacet;

  //Mumbai-specific
  const vrfCoordinator = "0xb96A95d11cE0B8E3AEdf332c9Df17fC31D379651";
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  // const installationDiamond = "0x6Ead866C75B485d4d1c123dc51eb6f749a02C797";
  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.MUMBAI_REALM_PK); // PK should start with '0x'

  console.log("Setting vars");
  const tx = await alchemicaFacet.setVars(
    //@ts-ignore
    alchemicaTotals(),
    boostMultipliers,
    greatPortalCapacity,
    installationDiamond,
    vrfCoordinator,
    linkAddress,
    [
      alchemica.fud.address,
      alchemica.fomo.address,
      alchemica.alpha.address,
      alchemica.kek.address,
    ],
    alchemica.glmr.address,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
    deployerAddress,
    tileDiamond,
    { gasPrice: gasPrice }
  );

  await tx.wait();

  console.log("RealmDiamond deployed:", realmDiamond.address);
  console.log("InstallationDiamond deployed:", installationDiamond);
  console.log("FUD deployed:", alchemica.fud.address);
  console.log("FOMO deployed:", alchemica.fomo.address);
  console.log("ALPHA deployed:", alchemica.alpha.address);
  console.log("KEK deployed:", alchemica.kek.address);
  console.log("GLMR deployed:", alchemica.glmr.address);

  const fudToken = (await ethers.getContractAt(
    "AlchemicaToken",
    alchemica.fud.address
  )) as AlchemicaToken;
  const owner = await fudToken.owner();
  console.log("owner:", owner);

  const deployedAlchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    realmDiamond.address
  )) as AlchemicaFacet;

  await deployedAlchemicaFacet.testingAlchemicaFaucet(
    "0",
    ethers.utils.parseEther("10")
  );

  const signers = await ethers.getSigners();
  const currentAccount = signers[0].address;

  const balance = await fudToken.balanceOf(currentAccount);

  console.log("balance:", balance.toString());

  return realmDiamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployMumbai()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
