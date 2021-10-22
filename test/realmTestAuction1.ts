import { impersonate } from "../scripts/helperFunctions";
import { RealmFacet, ERC721Facet } from "../typechain";
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
import { AxiosMetadataResponse, MintParcelInput } from "../types";

import {
  parcelMetadataFromTokenIds,
  parcelMetadataToContractInput,
} from "../helpers/metadataHelpers";
import { auction1 } from "../data/auction1";

const { deployDiamond } = require("../scripts/deploy.ts");

const testAddress = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
let diamondAddress;
let realmFacet: RealmFacet;
let erc721Facet: ERC721Facet;
let accounts;

describe("Realm tests", async function () {
  before(async function () {
    this.timeout(20000000);
    diamondAddress = await deployDiamond();
    accounts = await ethers.getSigners();

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      diamondAddress
    )) as RealmFacet;
    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      diamondAddress
    )) as ERC721Facet;
  });

  it("Check that tokens are being minted", async function () {
    const tokenIds = auction1.slice(0, 100);
    console.log("First 100 iDS:", tokenIds);

    const parcels: MintParcelInput[] = await parcelMetadataFromTokenIds(
      tokenIds
    );
    console.log("parcels:", parcels);

    const tx = await realmFacet.mintParcels(testAddress, tokenIds, parcels);
    await tx.wait();
    console.log(tx.hash);

    const parcel = await realmFacet.getParcelInfo("0");
    console.log("parcel:", parcel);
  });
});
