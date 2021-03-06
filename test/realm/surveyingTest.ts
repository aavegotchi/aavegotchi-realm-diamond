import {
  impersonate,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { RealmFacet } from "../../typechain";

import { MintParcelInput, TestBeforeVars } from "../../types";
import { BigNumberish } from "ethers";
import { beforeTest } from "../../scripts/realm/realmHelpers";

describe("Testing Realms Surveying", async function () {
  const testAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const realmIds = [2258, 12184];
  let parcelsTest1: MintParcelInput[] = [];

  const firstTestParcel = "2258";
  const boostedTestParcel = "12184";
  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);
    g = await beforeTest(ethers);
  });
  it("Test surveying first round", async function () {
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );

    for (let i = 0; i < realmIds.length; i++) {
      await g.alchemicaFacet.testingStartSurveying(realmIds[i]);
    }

    const roundAlchemica = await g.alchemicaFacet.getRoundAlchemica(
      firstTestParcel,
      "0"
    );

    expect(roundAlchemica[0]).to.gt(0);
    expect(roundAlchemica[1]).to.gt(0);
    expect(roundAlchemica[2]).to.gt(0);
    expect(roundAlchemica[3]).to.gt(0);
  });

  it("Test surveying other rounds", async function () {
    //can't survey round 1
    await expect(
      g.alchemicaFacet.testingStartSurveying(firstTestParcel)
    ).to.be.revertedWith("RealmFacet: Round not released");

    g.alchemicaFacet = await impersonate(
      g.ownerAddress,
      g.alchemicaFacet,
      ethers,
      network
    );

    //progress to round 1
    await g.alchemicaFacet.progressSurveyingRound();
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );

    for (let i = 0; i < realmIds.length; i++) {
      await g.alchemicaFacet.testingStartSurveying(realmIds[i]);
    }

    const roundAlchemica = await g.alchemicaFacet.getRoundAlchemica(
      firstTestParcel,
      "1"
    );

    expect(roundAlchemica[0]).to.gt(0);
    expect(roundAlchemica[1]).to.gt(0);
    expect(roundAlchemica[2]).to.gt(0);
    expect(roundAlchemica[3]).to.gt(0);
  });
  it("Round totals should equal 25% and 8.3%, respectively", async function () {
    const firstRoundAlchemicas = await g.alchemicaFacet.getRoundAlchemica(
      firstTestParcel,
      "0"
    );

    const secondRoundAlchemicas = await g.alchemicaFacet.getRoundAlchemica(
      firstTestParcel,
      "1"
    );

    const nineRoundsAlchemica: BigNumberish[] = [];
    secondRoundAlchemicas.forEach((alc) => {
      nineRoundsAlchemica.push(alc.mul(9));
    });

    const finalTally: BigNumberish[] = [];
    for (let index = 0; index < 4; index++) {
      finalTally.push(
        firstRoundAlchemicas[index].add(nineRoundsAlchemica[index])
      );
    }

    const percentagesFirstRound: BigNumberish[] = [];
    const percentagesRemainingRounds: BigNumberish[] = [];
    for (let index = 0; index < 4; index++) {
      const firstRoundAlchemica = Number(
        ethers.utils.formatEther(firstRoundAlchemicas[index])
      );
      const secondRoundAlchemica = Number(
        ethers.utils.formatEther(secondRoundAlchemicas[index])
      );
      const final = Number(ethers.utils.formatEther(finalTally[index]));

      percentagesFirstRound.push((firstRoundAlchemica / final).toFixed(2));
      percentagesRemainingRounds.push(
        (secondRoundAlchemica / final).toFixed(3)
      );
    }

    expect(percentagesFirstRound[0]).to.equal("0.25");
    expect(percentagesRemainingRounds[0]).to.equal("0.083");
  });

  it("Boost amounts should be accurate", async function () {
    const boostMultipliers = [1000, 500, 250, 100];

    const realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;

    const parcelInfo = await realmFacet.getParcelInfo(boostedTestParcel);

    const boosts = parcelInfo.boost;

    const roundTotal = await g.alchemicaFacet.getRoundAlchemica(
      boostedTestParcel,
      "1"
    );

    const roundBase = await g.alchemicaFacet.getRoundBaseAlchemica(
      boostedTestParcel,
      "1"
    );

    const boostAmounts: BigNumberish[] = [];

    roundTotal.forEach((num, index) => {
      boostAmounts.push(roundTotal[index].sub(roundBase[index]));
    });

    boostAmounts.forEach((amt, index) => {
      const boostAmount = Number(ethers.utils.formatEther(amt));
      expect(
        Number(boosts[index].toString()) * boostMultipliers[index]
      ).to.equal(boostAmount);
    });
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
    await g.alchemicaFacet.testingMintParcel(
      testAddress,
      [100000],
      parcelsTest1
    );
  });
});
