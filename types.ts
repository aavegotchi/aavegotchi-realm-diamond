import { BigNumberish } from "@ethersproject/bignumber";

export interface MintParcelInput {
  coordinateX: BigNumberish;
  coordinateY: BigNumberish;
  parcelId: BigNumberish;
  size: BigNumberish;
  fomoBoost: BigNumberish;
  fudBoost: BigNumberish;
  kekBoost: BigNumberish;
  alphaBoost: BigNumberish;
}
