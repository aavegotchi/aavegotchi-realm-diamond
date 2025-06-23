export const DATA_DIR = `${__dirname}/cloneData`;
export const DATA_DIR_PARCEL = `${DATA_DIR}/parcels`;
export const DATA_DIR_INSTALLATIONS = `${DATA_DIR}/installations`;
export const DATA_DIR_TILES = `${DATA_DIR}/tiles`;
export const BLOCKNUMBERFILE = `${DATA_DIR}/blockNumber.json`;

import fs from "fs";

interface BlockNumber {
  parcel: number;
  installation: number;
  tile: number;
  parcelMetadata: number;
}

export async function writeBlockNumber(
  assetType: "parcel" | "installation" | "tile" | "parcelMetadata",
  ethers: any
) {
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(
    `Using anchor Block number for ${assetType} data: ${blockNumber}`
  );
  //create the file if it doesn't exist
  if (!fs.existsSync(BLOCKNUMBERFILE)) {
    fs.writeFileSync(
      BLOCKNUMBERFILE,
      JSON.stringify({ [assetType]: blockNumber }, null, 2)
    );
  }
  //read the file and only update the assetType block number
  const blockNumberObject: BlockNumber = JSON.parse(
    fs.readFileSync(BLOCKNUMBERFILE, "utf8")
  );
  //direct update the block number
  blockNumberObject[assetType] = blockNumber;
  fs.writeFileSync(BLOCKNUMBERFILE, JSON.stringify(blockNumberObject, null, 2));
}
