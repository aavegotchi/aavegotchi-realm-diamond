import {
  impersonate,
  maticDiamondAddress,
  maticAavegotchiDiamondAddress,
} from "../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  RealmFacet,
  ERC721Facet,
  ERC721Marketplace,
  SurveyingFacet,
} from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-realmSurveying";

describe("Testing Realms Surveying", async function () {
  const testAddress = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
  const gbmAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
  let accounts;
  let ownerAddress;
  let realmFacet: RealmFacet;
  let erc721Facet: ERC721Facet;
  let erc721Marketplace: ERC721Marketplace;
  let surveyingFacet: SurveyingFacet;

  before(async function () {
    this.timeout(20000000);
    await upgrade();
    accounts = await ethers.getSigners();
    ownerAddress = accounts[0].address;

    // realmFacet = (await ethers.getContractAt(
    //   "RealmFacet",
    //   maticDiamondAddress
    // )) as RealmFacet;
    // erc721Facet = (await ethers.getContractAt(
    //   "ERC721Facet",
    //   maticDiamondAddress
    // )) as ERC721Facet;
    // erc721Marketplace = (await ethers.getContractAt(
    //   "ERC721Marketplace",
    //   maticAavegotchiDiamondAddress
    // )) as ERC721Marketplace;
    surveyingFacet = (await ethers.getContractAt(
      "SurveyingFacet",
      maticDiamondAddress
    )) as SurveyingFacet;
  });
  it("test", async function () {
    const a = await surveyingFacet.getAlchemicas();
    console.log(a);
  });
});
