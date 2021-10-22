import { BigNumberish } from "@ethersproject/bignumber";

export interface AxiosMetadataResponse {
  data: ParcelMetadata[];
}

export interface MintParcelInput {
  coordinateX: BigNumberish;
  coordinateY: BigNumberish;
  parcelId: string;
  size: BigNumberish;
  fomoBoost: BigNumberish;
  fudBoost: BigNumberish;
  kekBoost: BigNumberish;
  alphaBoost: BigNumberish;
}

export interface AlchemicaBoost {
  fud: number;
  fomo: number;
  alpha: number;
  kek: number;
}

export interface ParcelMetadata {
  auction: boolean;
  parcelId: string; //C-5010-2906-V
  alchemicaBoost: AlchemicaBoost;
  tokenId: number;
  parcelHash: string;
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
