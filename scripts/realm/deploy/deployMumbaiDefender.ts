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
import { deployDiamond } from "../../installation/deployDefender";
import { deployDiamondTile } from "../../tile/deployDefender";
import { mumbaiDiamondAddress } from "../../../constants";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";

const { getSelectors, FacetCutAction } = require("../../libraries/diamond.js");

interface Diamond {
  address: string;
}

const credentials = {
  apiKey: process.env.DEFENDER_API_KEY_MUMBAI,
  apiSecret: process.env.DEFENDER_SECRET_KEY_MUMBAI,
};
const provider = new DefenderRelayProvider(credentials);
const signer = new DefenderRelaySigner(credentials, provider, {
  speed: "fast",
});

async function deployRealmDiamond(deployerAddress: string) {
  console.log("Begin script");

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");

  console.log("Deploying diamond cut facet:");
  const diamondCutFacet = await DiamondCutFacet.connect(signer).deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = (await ethers.getContractFactory(
    "Diamond"
  )) as Diamond__factory;
  const diamond = await Diamond.connect(signer).deploy(
    deployerAddress,
    diamondCutFacet.address
  );
  await diamond.deployed();
  console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  const DiamondInit = (await ethers.getContractFactory(
    "DiamondInit"
  )) as DiamondInit__factory;
  const diamondInit = await DiamondInit.connect(signer).deploy();
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
    "TestHelpersRealm",
  ];
  const cut = [];
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    const facet = await Facet.connect(signer).deploy();
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
    .diamondCut(cut, diamondInit.address, functionCall);
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
  console.log("Diamond owner is:", deployerAddress);

  if (diamondOwner !== deployerAddress) {
    throw new Error(
      `Diamond owner ${diamondOwner} is not deployer address ${deployerAddress}!`
    );
  }

  return diamond as Diamond;
}

export async function deployMumbai() {
  const deployerAddress = await signer.getAddress();
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
  let tx = await alchemicaFacet.connect(signer).setVars(
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
    tileDiamond
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
  tx = await adminFacet
    .connect(signer)
    .setAddresses(
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

  const signers = await ethers.getSigners();
  const currentAccount = signers[0].address;

  const balance = await fudToken.balanceOf(currentAccount);

  console.log("balance:", balance.toString());

  console.log("set tile diamond vars");
  const tileFacet = (await ethers.getContractAt(
    "TileFacet",
    tileDiamond
  )) as TileFacet;

  const tileSetVarsTx = await tileFacet
    .connect(signer)
    .setAddresses(
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
