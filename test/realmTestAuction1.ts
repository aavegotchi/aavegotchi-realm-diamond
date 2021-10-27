import { RealmFacet, ERC721Facet } from "../typechain";
import { expect } from "chai";

import { ethers } from "hardhat";
import { MintParcelInput } from "../types";

import { parcelMetadataFromTokenIds } from "../helpers/metadataHelpers";
import { auction1 } from "../data/auction1";

const { deployDiamond } = require("../scripts/deploy.ts");

const testAddress = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
let diamondAddress;
let realmFacet: RealmFacet;
let erc721Facet: ERC721Facet;
let accounts;

describe("Realm auction tests", async function () {
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
    const tokenIds = auction1.slice(0, 50);

    const parcels: MintParcelInput[] = await parcelMetadataFromTokenIds(
      tokenIds
    );

    const tx = await realmFacet.mintParcels(testAddress, tokenIds, parcels);
    await tx.wait();

    const parcel = await realmFacet.getParcelInfo(tokenIds[0]);

    const expectedData = parcels[0];

    expect(parcel.coordinateX).to.equal(expectedData.coordinateX);
    expect(parcel.coordinateY).to.equal(expectedData.coordinateY);
    expect(parcel.size).to.equal(expectedData.size);
    expect(parcel.parcelId).to.equal(expectedData.parcelId);
    expect(parcel.district).to.equal(expectedData.district);
    expect(parcel.parcelAddress).to.equal(expectedData.parcelAddress);
  });
});
