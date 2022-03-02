import { ethers } from "ethers";
import {
  AlchemicaFacet,
  AlchemicaToken,
  ERC1155Facet,
  ERC1155FacetTile,
  InstallationFacet,
  TileFacet,
  OwnershipFacet,
  RealmFacet,
  GLMR,
} from "../../typechain";
import {
  InstallationTypeInput,
  TileTypeInput,
  InstallationTypeOutput,
  TileTypeOutput,
  TestBeforeVars,
} from "../../types";
import {
  maticDiamondAddress,
  maticAavegotchiDiamondAddress,
} from "../helperFunctions";
import { deployDiamond } from "../installation/deploy";
import { deployDiamondTile } from "../tile/deploy";
import { upgrade } from "./upgrades/upgrade-harvesting";

export function outputInstallation(
  installation: InstallationTypeInput
): InstallationTypeOutput {
  if (installation.width > 64) throw new Error("Width too much");
  if (installation.height > 64) throw new Error("Height too much");

  let output: InstallationTypeOutput = {
    deprecated: false,
    installationType: installation.installationType,
    level: installation.level,
    width: installation.width,
    height: installation.height,
    alchemicaType: installation.alchemicaType,
    alchemicaCost: installation.alchemicaCost.map((val) =>
      ethers.utils.parseEther(val.toString())
    ),
    harvestRate: ethers.utils.parseEther(installation.harvestRate.toString()),
    capacity: ethers.utils.parseEther(installation.capacity.toString()),
    spillRadius: ethers.utils.parseEther(installation.spillRadius.toString()),
    spillRate: ethers.utils.parseEther(installation.spillRate.toString()),
    upgradeQueueBoost: installation.upgradeQueueBoost,
    craftTime: installation.craftTime,
    nextLevelId: installation.nextLevelId,
    prerequisites: installation.prerequisites,
    name: installation.name,
  };

  return output;
}

export function outputTile(tile: TileTypeInput): TileTypeOutput {
  if (tile.width > 64) throw new Error("Width too much");
  if (tile.height > 64) throw new Error("Height too much");

  let output: TileTypeOutput = {
    deprecated: false,
    tileType: tile.tileType,
    width: tile.width,
    height: tile.height,
    alchemicaCost: tile.alchemicaCost.map((val) =>
      ethers.utils.parseEther(val.toString())
    ),
    craftTime: tile.craftTime,
    name: tile.name,
  };

  return output;
}

export function testInstallations() {
  const installations: InstallationTypeOutput[] = [];
  installations.push(
    outputInstallation({
      installationType: 0,
      level: 1,
      width: 1,
      height: 1,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      upgradeQueueBoost: 0,
      craftTime: 0,
      deprecated: true,
      nextLevelId: 0,
      prerequisites: [],
      name: "",
    })
  );
  installations.push(
    outputInstallation({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [100, 20, 0, 30],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      upgradeQueueBoost: 0,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
      name: "FUD Harvester level 1",
    })
  );
  installations.push(
    outputInstallation({
      installationType: 1,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [400, 50, 60, 60],
      harvestRate: 0,
      capacity: 500,
      spillRadius: 100,
      spillRate: 20,
      upgradeQueueBoost: 0,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 3,
      prerequisites: [],
      name: "FUD Reservoir level 1",
    })
  );
  installations.push(
    outputInstallation({
      installationType: 1,
      level: 2,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [40, 50, 60, 60],
      harvestRate: 0,
      capacity: 750,
      spillRadius: 75,
      spillRate: 10,
      upgradeQueueBoost: 0,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
      name: "FUD Reservoir level 2",
    })
  );
  installations.push(
    outputInstallation({
      installationType: 2,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [10, 10, 10, 10],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 20,
      upgradeQueueBoost: 0,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 5,
      prerequisites: [],
      name: "Altar level 1",
    })
  );
  installations.push(
    outputInstallation({
      installationType: 3,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [10, 10, 10, 10],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      upgradeQueueBoost: 1,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
      name: "BuildQueue level 1",
    })
  );

  return installations;
}

export function testTiles() {
  const tiles: TileTypeOutput[] = [];
  tiles.push(
    outputTile({
      tileType: 0,
      width: 1,
      height: 1,
      alchemicaCost: [0, 0, 0, 0],
      craftTime: 0,
      deprecated: true,
      name: "",
    })
  );
  tiles.push(
    outputTile({
      tileType: 1,
      width: 2,
      height: 2,
      alchemicaCost: [5, 5, 5, 5],
      craftTime: 1000,
      deprecated: true,
      name: "tile 1",
    })
  );
  tiles.push(
    outputTile({
      deprecated: true,
      tileType: 2,
      width: 4,
      height: 4,
      alchemicaCost: [10, 10, 10, 10],
      craftTime: 2000,
      name: "tile 2",
    })
  );
  tiles.push(
    outputTile({
      deprecated: true,
      tileType: 3,
      width: 8,
      height: 8,
      alchemicaCost: [20, 20, 20, 20],
      craftTime: 5000,
      name: "tile 3",
    })
  );
  return tiles;
}

export async function deployAlchemica(ethers: any) {
  const Fud = await ethers.getContractFactory("AlchemicaToken");
  let fud = (await Fud.deploy(
    "FUD",
    "FUD",
    ethers.utils.parseUnits("1000000000000"),
    maticDiamondAddress
  )) as AlchemicaToken;
  const Fomo = await ethers.getContractFactory("AlchemicaToken");
  let fomo = (await Fomo.deploy(
    "FOMO",
    "FOMO",
    ethers.utils.parseUnits("250000000000"),
    maticDiamondAddress
  )) as AlchemicaToken;
  const Alpha = await ethers.getContractFactory("AlchemicaToken");
  let alpha = (await Alpha.deploy(
    "ALPHA",
    "ALPHA",
    ethers.utils.parseUnits("125000000000"),
    maticDiamondAddress
  )) as AlchemicaToken;
  const Kek = await ethers.getContractFactory("AlchemicaToken");
  let kek = (await Kek.deploy(
    "KEK",
    "KEK",
    ethers.utils.parseUnits("100000000000"),
    maticDiamondAddress
  )) as AlchemicaToken;

  const Glmr = await ethers.getContractFactory("GLMR");
  let glmr = (await Glmr.deploy()) as GLMR;

  return {
    fud,
    fomo,
    alpha,
    kek,
    glmr,
  };
}

export async function beforeTest(ethers: any): Promise<TestBeforeVars> {
  const installationsAddress = await deployDiamond();
  const tileAddress = await deployDiamondTile();

  const alchemica = await deployAlchemica(ethers);

  const fud = alchemica.fud;
  const fomo = alchemica.fomo;
  const alpha = alchemica.alpha;
  const kek = alchemica.kek;
  const glmr = alchemica.glmr;

  await upgrade(installationsAddress, {
    fud: alchemica.fud.address,
    fomo: alchemica.fomo.address,
    alpha: alchemica.alpha.address,
    kek: alchemica.kek.address,
    glmr: alchemica.glmr.address,
  });

  const alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    maticDiamondAddress
  )) as AlchemicaFacet;
  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticDiamondAddress
  )) as RealmFacet;
  const installationDiamond = (await ethers.getContractAt(
    "InstallationFacet",
    installationsAddress
  )) as InstallationFacet;
  const tileDiamond = (await ethers.getContractAt(
    "TileFacet",
    tileAddress
  )) as TileFacet;

  const erc1155Facet = (await ethers.getContractAt(
    "ERC1155Facet",
    installationsAddress
  )) as ERC1155Facet;
  const erc1155FacetTile = (await ethers.getContractAt(
    "ERC1155FacetTile",
    tileAddress
  )) as ERC1155FacetTile;

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    maticDiamondAddress
  )) as OwnershipFacet;
  const ownerAddress = await ownershipFacet.owner();

  const installationOwnershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    installationsAddress
  )) as OwnershipFacet;
  const tileOwnershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    tileAddress
  )) as OwnershipFacet;
  const installationOwner = await installationOwnershipFacet.owner();
  const tileOwner = await tileOwnershipFacet.owner();

  await installationDiamond.setAddresses(
    maticAavegotchiDiamondAddress,
    maticDiamondAddress,
    glmr.address
  );
  await tileDiamond.setAddresses(
    maticAavegotchiDiamondAddress,
    maticDiamondAddress,
    glmr.address
  );

  return {
    alchemicaFacet,
    installationsAddress,
    realmFacet,
    installationDiamond,
    erc1155Facet,
    erc1155FacetTile,
    ownerAddress,
    installationOwner,
    fud,
    fomo,
    alpha,
    kek,
    glmr,
    tileDiamond,
    tileAddress,
    tileOwner,
  };
}
