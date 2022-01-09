import { BigNumberish } from "@ethersproject/bignumber";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AlchemicaFacet,
  AlchemicaToken,
  ERC1155Facet,
  GLMR,
  InstallationFacet,
  RealmFacet,
} from "./typechain";

export interface AxiosMetadataResponse {
  data: ParcelMetadata[];
}

export interface MintParcelInput {
  coordinateX: BigNumberish;
  coordinateY: BigNumberish;
  parcelId: string;
  parcelAddress: string;
  size: BigNumberish;
  boost: [BigNumberish, BigNumberish, BigNumberish, BigNumberish];
  district: BigNumberish;
}

export interface ParcelMetadata {
  auction: boolean;
  parcelId: string; //C-5010-2906-V
  boost: [number, number, number, number];
  tokenId: number;
  parcelHash: string;
  district: number;
  x: number;
  y: number;
  type: "humble" | "reasonable" | "spacious";
  width: number;
  height: number;
  region: string;
  use: "sell" | "raffle";
}

export interface ParcelArray {
  0: string;
  1: number;
  2: number;
  3: "H" | "V";
}

export interface UpgradeQueue {
  parcelId: BigNumberish;
  coordinateX: BigNumberish;
  coordinateY: BigNumberish;
  installationId: BigNumberish;
  readyBlock: BigNumberish;
  claimed: boolean;
  owner: string;
}

export interface InstallationType {
  deprecated: boolean;
  installationType: BigNumberish;
  level: BigNumberish;
  width: BigNumberish;
  height: BigNumberish;
  alchemicaType: BigNumberish;
  alchemicaCost: BigNumberish[];
  harvestRate: BigNumberish;
  capacity: BigNumberish;
  spillRadius: BigNumberish;
  spillRate: BigNumberish;
  craftTime: BigNumberish;
  nextLevelId: BigNumberish;
  prerequisites: BigNumberish[];
}

export interface InstallationTypeInput {
  deprecated: boolean;
  installationType: number;
  level: Level;
  width: Width;
  height: Height;
  alchemicaType: 0 | 1 | 2 | 3;
  alchemicaCost: BigNumberish[];
  harvestRate: BigNumberish;
  capacity: BigNumberish;
  spillRadius: BigNumberish;
  spillRate: BigNumberish;
  craftTime: number;
  nextLevelId: number;
  prerequisites: number[];
}

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Width = 1 | 2 | 3 | 4;
export type Height = 1 | 2 | 3 | 4;
export interface InstallationTypeOutput {
  deprecated: boolean;
  installationType: BigNumberish;
  level: Level;
  width: Width;
  height: Height;
  alchemicaType: BigNumberish;
  alchemicaCost: BigNumberish[];
  harvestRate: BigNumberish;
  capacity: BigNumberish;
  spillRadius: BigNumberish;
  spillRate: BigNumberish;
  craftTime: BigNumberish;
  nextLevelId: BigNumberish;
  prerequisites: BigNumberish[];
}

export type AlchemicaTotals = [
  [BigNumberish, BigNumberish, BigNumberish, BigNumberish]
];

//Test

export interface TestBeforeVars {
  alchemicaFacet: AlchemicaFacet;
  realmFacet: RealmFacet;
  installationDiamond: InstallationFacet;
  ownerAddress: string;
  installationsAddress: string;
  fud: AlchemicaToken;
  fomo: AlchemicaToken;
  alpha: AlchemicaToken;
  kek: AlchemicaToken;
  glmr: GLMR;
  erc1155Facet: ERC1155Facet;
  installationOwner: string;
}
