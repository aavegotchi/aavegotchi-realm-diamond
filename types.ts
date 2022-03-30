import { BigNumberish } from "@ethersproject/bignumber";

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

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Width = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Height = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
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
