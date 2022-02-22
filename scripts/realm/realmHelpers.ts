import { ethers } from "ethers";
import {
  AlchemicaFacet,
  AlchemicaToken,
  ERC1155Facet,
  InstallationFacet,
  OwnershipFacet,
  RealmFacet,
  GLMR,
} from "../../typechain";
import {
  InstallationTypeInput,
  InstallationTypeOutput,
  TestBeforeVars,
} from "../../types";
import { maticAavegotchiDiamondAddress } from "../helperFunctions";
import { deployDiamond } from "../installation/deploy";
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
    craftTime: installation.craftTime,
    nextLevelId: installation.nextLevelId,
    prerequisites: installation.prerequisites,
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
      craftTime: 0,
      deprecated: true,
      nextLevelId: 0,
      prerequisites: [],
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
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
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
      craftTime: 20000,
      deprecated: false,
      nextLevelId: 3,
      prerequisites: [],
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
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
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
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
    })
  );

  return installations;
}

export function goldenAaltar() {
  const installations: InstallationTypeOutput[] = [];

  //Level 1 GA
  installations.push(
    outputInstallation({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 50,
      craftTime: 0,
      deprecated: true,
      nextLevelId: 1,
      prerequisites: [],
    })
  );

  //Level 2 GA
  installations.push(
    outputInstallation({
      installationType: 0,
      level: 2,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [100, 20, 0, 30],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 45,
      craftTime: 1000,
      deprecated: false,
      nextLevelId: 2,
      prerequisites: [],
    })
  );
  installations.push(
    outputInstallation({
      installationType: 1,
      level: 3,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [400, 50, 60, 60],
      harvestRate: 0,
      capacity: 500,
      spillRadius: 100,
      spillRate: 40,
      craftTime: 20000,
      deprecated: false,
      nextLevelId: 3,
      prerequisites: [],
    })
  );
  installations.push(
    outputInstallation({
      installationType: 1,
      level: 4,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [40, 50, 60, 60],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 35,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 4,
      prerequisites: [],
    })
  );

  return installations;
}

export async function deployAlchemica(ethers: any, diamondAddress: string) {
  const Fud = await ethers.getContractFactory("AlchemicaToken");
  let fud = (await Fud.deploy(
    "FUD",
    "FUD",
    ethers.utils.parseUnits("1000000000000"),
    diamondAddress
  )) as AlchemicaToken;
  const Fomo = await ethers.getContractFactory("AlchemicaToken");
  let fomo = (await Fomo.deploy(
    "FOMO",
    "FOMO",
    ethers.utils.parseUnits("250000000000"),
    diamondAddress
  )) as AlchemicaToken;
  const Alpha = await ethers.getContractFactory("AlchemicaToken");
  let alpha = (await Alpha.deploy(
    "ALPHA",
    "ALPHA",
    ethers.utils.parseUnits("125000000000"),
    diamondAddress
  )) as AlchemicaToken;
  const Kek = await ethers.getContractFactory("AlchemicaToken");
  let kek = (await Kek.deploy(
    "KEK",
    "KEK",
    ethers.utils.parseUnits("100000000000"),
    diamondAddress
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

export async function beforeTest(
  ethers: any,
  diamondAddress: string
): Promise<TestBeforeVars> {
  const installationsAddress = await deployDiamond();

  const alchemica = await deployAlchemica(ethers, diamondAddress);

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
    diamondAddress
  )) as AlchemicaFacet;
  const realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    diamondAddress
  )) as RealmFacet;
  const installationDiamond = (await ethers.getContractAt(
    "InstallationFacet",
    installationsAddress
  )) as InstallationFacet;

  const erc1155Facet = (await ethers.getContractAt(
    "ERC1155Facet",
    installationsAddress
  )) as ERC1155Facet;

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const ownerAddress = await ownershipFacet.owner();

  const installationOwnershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    installationsAddress
  )) as OwnershipFacet;
  const installationOwner = await installationOwnershipFacet.owner();

  await installationDiamond.setAddresses(
    maticAavegotchiDiamondAddress,
    diamondAddress,
    glmr.address
  );

  return {
    alchemicaFacet,
    installationsAddress,
    realmFacet,
    installationDiamond,
    erc1155Facet,
    ownerAddress,
    installationOwner,
    fud,
    fomo,
    alpha,
    kek,
    glmr,
  };
}
