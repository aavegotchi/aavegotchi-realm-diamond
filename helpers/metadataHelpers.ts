import {
  AxiosMetadataResponse,
  MintParcelInput,
  ParcelArray,
  ParcelMetadata,
} from "../types";
import axios from "axios";

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

  const size = sizeNameToId(orientation);

  return {
    coordinateX: x,
    coordinateY: y,
    parcelId: parcelMetadata.parcelId,
    size,
    boost: parcelMetadata.boost,
    parcelAddress: parcelMetadata.parcelHash,
    district: parcelMetadata.district,
  };
}

export async function parcelMetadataFromTokenIds(
  tokenIds: string[]
): Promise<MintParcelInput[]> {
  const parcels: MintParcelInput[] = [];
  const res = await axios(
    `https://api.gotchiverse.io/realm/parcel/info?tokenId=${tokenIds.join(",")}`
  );
  const parcelMetadata: AxiosMetadataResponse = res.data;

  for (let i = 0; i < tokenIds.length; i++) {
    const contractInput = parcelMetadataToContractInput(parcelMetadata.data[i]);
    parcels.push(contractInput);
  }
  return parcels;
}
