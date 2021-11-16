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
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
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
    surveyingFacet = await impersonate(
      testAddress,
      surveyingFacet,
      ethers,
      network
    );
    await surveyingFacet.testingStartSurveying(2893, 0);
    const a = await surveyingFacet.getRealmAlchemica(2893);
    console.log(ethers.utils.formatUnits(a[0], 0));
    console.log(ethers.utils.formatUnits(a[1], 0));
    console.log(ethers.utils.formatUnits(a[2], 0));
    console.log(ethers.utils.formatUnits(a[3], 0));
  });
});
