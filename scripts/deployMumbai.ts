//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { ethers, network } from "hardhat";
import {
  DiamondCutFacet,
  DiamondInit__factory,
  Diamond__factory,
  OwnershipFacet,
  AlchemicaFacet,
  ERC721Facet,
  RealmFacet,
  VRFFacet,
  AlchemicaToken,
} from "../typechain";
import { gasPrice, impersonate } from "./helperFunctions";

const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

export async function deployDiamond() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];
  const deployerAddress = await deployer.getAddress();
  console.log("Deployer:", deployerAddress);

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy({
    gasPrice: gasPrice,
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

  // deploy alchemicas ERC20
  const alchemica = await ethers.getContractFactory("AlchemicaToken");
  let fud = (await alchemica.deploy(
    "FUD",
    "FUD",
    ethers.utils.parseUnits("1000000000000"),
    diamond.address
  )) as AlchemicaToken;
  console.log("FUD deployed to ", fud.address);
  let fomo = (await alchemica.deploy(
    "FOMO",
    "FOMO",
    ethers.utils.parseUnits("250000000000"),
    diamond.address
  )) as AlchemicaToken;
  console.log("FOMO deployed to ", fomo.address);
  let alpha = (await alchemica.deploy(
    "ALPHA",
    "ALPHA",
    ethers.utils.parseUnits("125000000000"),
    diamond.address
  )) as AlchemicaToken;
  console.log("ALPHA deployed to ", alpha.address);
  let kek = (await alchemica.deploy(
    "KEK",
    "KEK",
    ethers.utils.parseUnits("100000000000"),
    diamond.address
  )) as AlchemicaToken;
  console.log("KEK deployed to ", kek.address);

  await fud.transferOwnership(diamond.address);
  await fomo.transferOwnership(diamond.address);
  await alpha.transferOwnership(diamond.address);
  await kek.transferOwnership(diamond.address);

  const hardcodedAlchemicasTotals: any = [
    [14154, 7076, 3538, 1414],
    [56618, 28308, 14154, 5660],
    [452946, 226472, 113236, 45294],
    [452946, 226472, 113236, 45294],
    [905894, 452946, 226472, 90588],
  ];

  for (let i = 0; i < hardcodedAlchemicasTotals.length; i++) {
    for (let j = 0; j < hardcodedAlchemicasTotals[i].length; j++) {
      hardcodedAlchemicasTotals[i][j] = ethers.utils.parseUnits(
        hardcodedAlchemicasTotals[i][j].toString()
      );
    }
  }

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    diamond.address
  )) as AlchemicaFacet;

  //Mumbai-specific
  const vrfCoordinator = "0xb96A95d11cE0B8E3AEdf332c9Df17fC31D379651";
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  const installationDiamond = "0x6Ead866C75B485d4d1c123dc51eb6f749a02C797";
  const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

  const initVars = await alchemicaFacet.setVars(
    //@ts-ignore
    hardcodedAlchemicasTotals,
    installationDiamond,
    diamond.address,
    vrfCoordinator,
    linkAddress,
    [fud.address, fomo.address, alpha.address, kek.address],
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
  );

  const initVarsReceipt = await initVars.wait();
  console.log("initVarsReceipt", initVarsReceipt);

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
