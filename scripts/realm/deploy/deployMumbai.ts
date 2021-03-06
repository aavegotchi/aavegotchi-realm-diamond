//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import {
  DiamondCutFacet,
  DiamondInit__factory,
  Diamond__factory,
  OwnershipFacet,
  AlchemicaFacet,
  AlchemicaToken,
  InstallationAdminFacet,
  InstallationFacet,
  TileFacet,
} from "../../../typechain";
import { gasPrice, maticAavegotchiDiamondAddress } from "../../helperFunctions";
import { deployAlchemica, goldenAaltar, testnetAltar } from "../realmHelpers";
import { alchemicaTotals, boostMultipliers } from "../../setVars";
import { deployDiamond } from "../../installation/deploy";
import { deployDiamondTile } from "../../tile/deploy";

const { getSelectors, FacetCutAction } = require("../../libraries/diamond.js");

interface Diamond {
  address: string;
}

async function deployRealmDiamond(deployerAddress: string) {
  console.log("Begin script");

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");

  console.log("Deploying diamond cut facet:");
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
  const vrfCoordinator = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
  const linkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  // const installationDiamond = "0x6Ead866C75B485d4d1c123dc51eb6f749a02C797";
  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.MUMBAI_REALM_PK); // PK should start with '0x'

  console.log("Setting vars");
  let tx = await alchemicaFacet.setVars(
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
    alchemica.gltr.address,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
    deployerAddress,
    tileDiamond,
    tileDiamond,
    { gasPrice: gasPrice }
  );

  await tx.wait();

  const pixelcraft = deployerAddress;
  const dao = deployerAddress;

  console.log("Setting Installation addresses");
  const adminFacet = await ethers.getContractAt(
    "InstallationAdminFacet",
    installationDiamond
  );
  console.log("Setting addresses");
  tx = await adminFacet.setAddresses(
    maticAavegotchiDiamondAddress,
    realmDiamond.address,
    alchemica.gltr.address,
    pixelcraft,
    dao,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
  );
  await tx.wait();

  console.log("RealmDiamond deployed:", realmDiamond.address);
  console.log("InstallationDiamond deployed:", installationDiamond);
  console.log("FUD deployed:", alchemica.fud.address);
  console.log("FOMO deployed:", alchemica.fomo.address);
  console.log("ALPHA deployed:", alchemica.alpha.address);
  console.log("KEK deployed:", alchemica.kek.address);
  console.log("GLTR deployed:", alchemica.gltr.address);
  console.log("Tile Diamond deployed:", tileDiamond);

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

  console.log("set tile diamond vars");
  const tileFacet = (await ethers.getContractAt(
    "TileFacet",
    tileDiamond
  )) as TileFacet;

  const tileSetVarsTx = await tileFacet.setAddresses(
    ethers.constants.AddressZero,
    realmDiamond.address,
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    ethers.constants.AddressZero
  );

  await tileSetVarsTx.wait();

  // const installationAdminFacet = (await ethers.getContractAt(
  //   "InstallationAdminFacet",
  //   installationDiamond,
  //   signers[0]
  // )) as InstallationAdminFacet;

  // const installationFacet = (await ethers.getContractAt(
  //   "InstallationFacet",
  //   installationDiamond,
  //   signers[0]
  // )) as InstallationFacet;

  // console.log("Adding Golden Altar");
  // const addTx = await installationAdminFacet.addInstallationTypes(
  //   testnetAltar(),
  //   {
  //     gasPrice: gasPrice,
  //   }
  // );
  // await addTx.wait();

  // const installations = await installationFacet.getInstallationTypes([]);
  // console.log("installations:", installations);

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
