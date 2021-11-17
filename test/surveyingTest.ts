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
import { MintParcelInput } from "../types";

describe("Testing Realms Surveying", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const gbmAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
  const realmIds = [
    2893, 3642, 5962, 2800, 7015, 8877, 6453, 15536, 4565, 5212,
  ];
  let accounts;
  let ownerAddress;
  let realmFacet: RealmFacet;
  let erc721Facet: ERC721Facet;
  let erc721Marketplace: ERC721Marketplace;
  let surveyingFacet: SurveyingFacet;
  let parcelsTest1: MintParcelInput[] = [];

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
  it("Test surveying", async function () {
    surveyingFacet = await impersonate(
      testAddress,
      surveyingFacet,
      ethers,
      network
    );
    let alchemicas: any = [[], [], [], []];
    for (let i = 0; i < realmIds.length; i++) {
      await surveyingFacet.testingStartSurveying(realmIds[i], 0);
      const alchemica = await surveyingFacet.getRealmAlchemica(realmIds[i]);
      for (let i = 0; i < alchemica.length; i++) {
        alchemicas[i].push(Number(ethers.utils.formatUnits(alchemica[i], 0)));
      }
    }
    const average = (arr: number[]) =>
      arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
    console.log(average(alchemicas[0]));
    console.log(average(alchemicas[1]));
    console.log(average(alchemicas[2]));
    console.log(average(alchemicas[3]));
    //averages 45294 22647 11323 4529
  });

  it("Test testingMintParcel", async function () {
    const size = Math.floor(Math.random() * 5);
    const boostFomo = Math.floor(Math.random() * 4);
    const boostFud = Math.floor(Math.random() * 4);
    const boostKek = Math.floor(Math.random() * 4);
    const boostAlpha = Math.floor(Math.random() * 4);
    parcelsTest1.push({
      coordinateX: 0,
      coordinateY: 0,
      parcelId: "100000",
      size,
      boost: [boostFud, boostFomo, boostAlpha, boostKek],
      district: 1,
      parcelAddress: "i-like-surveying",
    });
    await surveyingFacet.testingMintParcel(testAddress, [100000], parcelsTest1);
  });
});
