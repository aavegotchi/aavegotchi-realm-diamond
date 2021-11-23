import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SurveyingFacet, OwnershipFacet } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-realmSurveying";
import { MintParcelInput } from "../types";

describe("Testing Realms Surveying", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const realmIds = [
    2893, 3642, 5962, 2800, 7015, 8877, 6453, 15536, 4565, 5212,
  ];
  let ownerAddress: string;
  let surveyingFacet: SurveyingFacet;
  let ownershipFacet: OwnershipFacet;
  let parcelsTest1: MintParcelInput[] = [];

  before(async function () {
    this.timeout(20000000);
    await upgrade();

    surveyingFacet = (await ethers.getContractAt(
      "SurveyingFacet",
      maticDiamondAddress
    )) as SurveyingFacet;
    ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      maticDiamondAddress
    )) as OwnershipFacet;
    ownerAddress = await ownershipFacet.owner();
    console.log("ownerAddress", ownerAddress);
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
    //expected averages 45294 22647 11323 4529
  });

  it("Test surveying rounds", async function () {
    await expect(
      surveyingFacet.testingStartSurveying(8094, 1)
    ).to.be.revertedWith("RealmFacet: Round not released");
    await expect(
      surveyingFacet.testingStartSurveying(8094, 2)
    ).to.be.revertedWith("RealmFacet: Round not released");
    await surveyingFacet.testingStartSurveying(8094, 0);
    await expect(
      surveyingFacet.testingStartSurveying(8094, 0)
    ).to.be.revertedWith("RealmFacet: Wrong round");
    surveyingFacet = await impersonate(
      ownerAddress,
      surveyingFacet,
      ethers,
      network
    );
    await surveyingFacet.progressSurveyingRound();
    surveyingFacet = await impersonate(
      testAddress,
      surveyingFacet,
      ethers,
      network
    );
    await expect(
      surveyingFacet.testingStartSurveying(10479, 2)
    ).to.be.revertedWith("RealmFacet: Round not released");
    await expect(
      surveyingFacet.testingStartSurveying(10479, 1)
    ).to.be.revertedWith("RealmFacet: Wrong round");
    await surveyingFacet.testingStartSurveying(10479, 0);
    await expect(
      surveyingFacet.testingStartSurveying(10479, 0)
    ).to.be.revertedWith("RealmFacet: Wrong round");
    await surveyingFacet.testingStartSurveying(10479, 1);
    await expect(
      surveyingFacet.testingStartSurveying(10479, 0)
    ).to.be.revertedWith("RealmFacet: Wrong round");
    await expect(
      surveyingFacet.testingStartSurveying(10479, 1)
    ).to.be.revertedWith("RealmFacet: Wrong round");
    await expect(
      surveyingFacet.testingStartSurveying(10479, 2)
    ).to.be.revertedWith("RealmFacet: Round not released");
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
