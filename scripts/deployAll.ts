//@ts-ignore
import { Signer } from "@ethersproject/abstract-signer";
import { ethers } from "hardhat";
import {
  DiamondCutFacet,
  DiamondInit__factory,
  Diamond__factory,
  OwnershipFacet,
  AlchemicaFacet,
  InstallationAdminFacet,
  TileFacet,
  RealmGettersAndSettersFacet,
  VRFFacet,
} from "../typechain";
import { gasPrice } from "./helperFunctions";
import {
  deployAlchemica,
  outputInstallation,
  outputTile,
} from "./realm/realmHelpers";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "./setVars";
import { deployDiamond } from "./installation/deploy";
import { deployDiamondTile } from "./tile/deploy";
import { installationTypes as mainInstallationTypes } from "../data/installations/installationTypes";
import { installationTypes as farmingInstallationTypes } from "../data/installations/farming";
import { installationTypes as nftInstallationTypes } from "../data/installations/nftDisplay";
import { installationTypes as bounceGateInstallationTypes } from "../data/installations/bounceGate";
import { installationTypes as halloweenInstallationTypes } from "../data/installations/halloween";
import { installationTypes as xmasInstallationTypes } from "../data/installations/xmas";
import { installationTypes as nftBigInstallationTypes } from "../data/installations/nftDisplay_big";
import { tileTypes } from "../data/tiles/tileTypes";

const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

interface Diamond {
  address: string;
}

async function deployRealmDiamond(deployerAddress: string) {
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
    "RealmGettersAndSettersFacet",
    "RealmGridFacet",
    "AlchemicaFacet",
    "BounceGateFacet",
    "NFTDisplayFacet",
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

export async function deploy() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const privateKey = ethers.Wallet.createRandom().privateKey

  // Constants
  // TODO: Confirm
  const vrfCoordinator = ethers.constants.AddressZero;
  const linkAddress = ethers.constants.AddressZero;
  const aavegotchiDiamond = ethers.constants.AddressZero;
  const backendSigner = new ethers.Wallet(privateKey); // PK should start with '0x'
  const deployerAddress = await deployer.getAddress();
  const pixelcraft = deployerAddress;
  const dao = deployerAddress;
  const requestConfig = {
    subId: 114,
    callbackGasLimit: 500_000,
    requestConfirmations: 32,
    numWords: 4,
    keyHash:
      "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93",
  };

  console.log("Deployer:", deployerAddress);

  console.log("\nDeploying Realm Diamond");
  const realmDiamond = await deployRealmDiamond(deployerAddress);

  console.log("\nDeploying Installation Diamond");
  const installationDiamond = await deployDiamond(realmDiamond.address);

  console.log("\nDeploying Tile Diamond");
  const tileDiamond = await deployDiamondTile(realmDiamond.address);

  console.log("\nDeploying Alchemicas");
  const alchemica = await deployAlchemica(ethers, realmDiamond.address);

  console.log("Realm Diamond deployed:", realmDiamond.address);
  console.log("InstallationDiamond deployed:", installationDiamond);
  console.log("Tile Diamond deployed:", tileDiamond);
  console.log("FUD deployed:", alchemica.fud.address);
  console.log("FOMO deployed:", alchemica.fomo.address);
  console.log("ALPHA deployed:", alchemica.alpha.address);
  console.log("KEK deployed:", alchemica.kek.address);
  console.log("GLTR deployed:", alchemica.gltr.address);

  //@ts-ignore
  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    realmDiamond.address,
    deployer
  )) as AlchemicaFacet;

  console.log("Setting vars for realm diamond");
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
    aavegotchiDiamond,
    { gasPrice: gasPrice }
  );
  await tx.wait();

  console.log("Setting channeling Limits in realm diamond");
  tx = await alchemicaFacet.setChannelingLimits(
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [
      24 * 3600,
      18 * 3600,
      12 * 3600,
      8 * 3600,
      6 * 3600,
      4 * 3600,
      3 * 3600,
      2 * 3600,
      3600,
    ],
    { gasPrice: gasPrice }
  );
  await tx.wait();

  const vrfFacet = (await ethers.getContractAt(
    "VRFFacet",
    realmDiamond.address,
    deployer
  )) as VRFFacet;

  console.log("Setting VRF configs in realm diamond");
  tx = await vrfFacet.setConfig(requestConfig, vrfCoordinator, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  const realmGettersAndSettersFacet = (await ethers.getContractAt(
    "RealmGettersAndSettersFacet",
    realmDiamond.address,
    deployer
  )) as RealmGettersAndSettersFacet;

  console.log("Setting game active in realm diamond");
  tx = await realmGettersAndSettersFacet.setGameActive(true, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  const installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    installationDiamond,
    deployer
  )) as InstallationAdminFacet;

  console.log("Setting addresses for installation diamond");
  tx = await installationAdminFacet.setAddresses(
    aavegotchiDiamond,
    realmDiamond.address,
    alchemica.gltr.address,
    pixelcraft,
    dao,
    ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
  );
  await tx.wait();

  console.log("Adding installation types");
  const installationTypes = [
    mainInstallationTypes,
    farmingInstallationTypes,
    nftInstallationTypes,
    bounceGateInstallationTypes,
    halloweenInstallationTypes,
    xmasInstallationTypes,
    nftBigInstallationTypes,
  ];
  for (let i = 0; i < installationTypes.length; i++) {
    tx = await installationAdminFacet.addInstallationTypes(
      installationTypes[i].map((val) => outputInstallation(val)),
      {
        gasPrice: gasPrice,
      }
    );
    await tx.wait();
  }

  // const installationFacet = (await ethers.getContractAt(
  //   "InstallationFacet",
  //   installationDiamond,
  //   signers[0]
  // )) as InstallationFacet;
  // const installationTypes = await installationFacet.getInstallationTypes([]);
  // console.log("Saved installationTypes:", installationTypes);

  const tileFacet = (await ethers.getContractAt(
    "TileFacet",
    tileDiamond,
    deployer
  )) as TileFacet;

  console.log("Setting addresses for tile diamond");
  tx = await tileFacet.setAddresses(
    aavegotchiDiamond,
    realmDiamond.address,
    alchemica.gltr.address,
    pixelcraft,
    dao
  );
  await tx.wait();

  // console.log("Adding tile types");
  // tx = await tileFacet.addTileTypes(
  //   tileTypes.map((val) => outputTile(val)),
  //   {
  //     gasPrice: gasPrice,
  //   }
  // );
  // await tx.wait();

  // console.log('Getting tile types')
  // const tileTypes = await tileFacet.getTileTypes([]);
  // console.log("Saved tileTypes:", tileTypes);
  
  
  // console.log('Crafting tiles')
  // tileFacet.craftTiles([1])

  return realmDiamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
