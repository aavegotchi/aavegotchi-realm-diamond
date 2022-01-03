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

export interface UpgradeQueue {
  parcelId: BigNumberish;
  coordinateX: BigNumberish;
  coordinateY: BigNumberish;
  prevInstallationId: BigNumberish;
  nextInstallationId: BigNumberish;
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
