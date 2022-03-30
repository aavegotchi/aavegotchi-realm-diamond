import { BigNumberish } from "@ethersproject/bignumber";
import {
  AlchemicaFacet,
  AlchemicaToken,
  ERC1155Facet,
  ERC1155FacetTile,
  GLTR,
  InstallationAdminFacet,
  InstallationFacet,
  RealmFacet,
  TileFacet,
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
  upgradeQueueBoost: BigNumberish;
  craftTime: BigNumberish;
  nextLevelId: BigNumberish;
  prerequisites: BigNumberish[];
  name: string;
}

export interface InstallationTypeInput {
  id?: number;
  deprecated: boolean;
  installationType: number;
  level: Level;
  width: Width;
  height: Height;
  alchemicaType: 0 | 1 | 2 | 3;
  alchemicaCost: [BigNumberish, BigNumberish, BigNumberish, BigNumberish];
  harvestRate: BigNumberish;
  capacity: BigNumberish;
  spillRadius: BigNumberish;
  spillRate: BigNumberish;
  upgradeQueueBoost: BigNumberish;
  craftTime: number;
  nextLevelId: number;
  prerequisites: number[];
  name: string;
}

export interface TileTypeInput {
  deprecated: boolean;
  tileType: number;
  width: Width;
  height: Height;
  alchemicaCost: BigNumberish[];
  craftTime: number;
  name: string;
}

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Width = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Height = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export interface InstallationTypeOutput {
  deprecated: boolean;
  installationType: BigNumberish;
  level: Level;
  width: Width;
  height: Height;
  alchemicaType: BigNumberish;
  alchemicaCost: [BigNumberish, BigNumberish, BigNumberish, BigNumberish];
  harvestRate: BigNumberish;
  capacity: BigNumberish;
  spillRadius: BigNumberish;
  spillRate: BigNumberish;
  upgradeQueueBoost: BigNumberish;
  craftTime: BigNumberish;
  nextLevelId: BigNumberish;
  prerequisites: BigNumberish[];
  name: string;
}

export interface TileTypeOutput {
  deprecated: boolean;
  tileType: BigNumberish;
  width: Width;
  height: Height;
  alchemicaCost: BigNumberish[];
  craftTime: BigNumberish;
  name: string;
}

export type AlchemicaTotals = [
  [BigNumberish, BigNumberish, BigNumberish, BigNumberish]
];

//Test

export interface TestBeforeVars {
  alchemicaFacet: AlchemicaFacet;
  realmFacet: RealmFacet;
  installationDiamond: InstallationFacet;
  installationAdminFacet: InstallationAdminFacet;
  tileDiamond: TileFacet;
  ownerAddress: string;
  installationsAddress: string;
  tileAddress: string;
  fud: AlchemicaToken;
  fomo: AlchemicaToken;
  alpha: AlchemicaToken;
  kek: AlchemicaToken;
  gltr: GLTR;
  erc1155Facet: ERC1155Facet;
  erc1155FacetTile: ERC1155FacetTile;
  installationOwner: string;
  tileOwner: string;
  alchemicaOwner: string;
}

export interface AlchemicaAddresses {
  fud: string;
  fomo: string;
  alpha: string;
  kek: string;
  gltr: string;
}

export interface Alchemica {
  fud: AlchemicaToken;
  fomo: AlchemicaToken;
  alpha: AlchemicaToken;
  kek: AlchemicaToken;
  gltr: GLTR;
}
