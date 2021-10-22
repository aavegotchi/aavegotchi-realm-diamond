import { MintParcelInput, ParcelArray, ParcelMetadata } from "../types";

export function sizeNameToId(
  orientation: string //H=humble, R=reasonable, U=horizontal, S=spacious
): number {
  //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
  if (orientation === "H") return 0;
  if (orientation === "R") return 1;
  if (orientation === "V") return 2;
  if (orientation === "U") return 3;
  return 0;
}

export function parcelMetadataToContractInput(
  parcelMetadata: ParcelMetadata
): MintParcelInput {
  console.log("metadata:", parcelMetadata);

  const parcelArray = parcelMetadata.parcelId.split("-");
  //  const region = parcelArray[0];
  const x = parcelArray[1];
  const y = parcelArray[2];
  const orientation = parcelArray[3];

  console.log("metadata:", parcelMetadata);

  const size = sizeNameToId(orientation);
  const boostFud = parcelMetadata.alchemicaBoost.fud;

  const boostFomo = parcelMetadata.alchemicaBoost.fomo;
  const boostAlpha = parcelMetadata.alchemicaBoost.alpha;
  const boostKek = parcelMetadata.alchemicaBoost.kek;
  return {
    coordinateX: x,
    coordinateY: y,
    parcelId: parcelMetadata.parcelId,
    size,
    fomoBoost: boostFomo,
    fudBoost: boostFud,
    kekBoost: boostKek,
    alphaBoost: boostAlpha,
  };
}
