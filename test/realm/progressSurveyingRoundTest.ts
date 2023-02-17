import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { AlchemicaFacet, OwnershipFacet } from "../../typechain";
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-vrfTest";
import { maticVars } from "../../constants";

describe("Testing Progress Surveying Round", async function () {
  let alchemicaFacet: AlchemicaFacet;
  let alchemicaFacetWithOwner: AlchemicaFacet;

  const testAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const testRealmId = 2258;

  before(async function () {
    this.timeout(20000000);

    await upgradeRealm();

    const diamondAddress = maticVars.realmDiamond;

    const ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;
    const owner = await ownershipFacet.owner();

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      diamondAddress
    )) as AlchemicaFacet;

    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );
    alchemicaFacetWithOwner = await impersonate(
      owner,
      alchemicaFacet,
      ethers,
      network
    );
  });

  it("Should revert test surveying first(current) round", async function () {
    await expect(
      alchemicaFacet.testingStartSurveying(testRealmId)
    ).to.be.revertedWith("AlchemicaFacet: Round not released");
  });

  it("Should start surveying after progress round", async function () {
    const roundAlchemicaBefore = await alchemicaFacet.getRoundAlchemica(
      testRealmId,
      "1"
    );
    expect(roundAlchemicaBefore.length).to.equal(0);

    // progress to round 1
    await alchemicaFacetWithOwner.progressSurveyingRound();

    await alchemicaFacet.testingStartSurveying(testRealmId);

    const roundAlchemica = await alchemicaFacet.getRoundAlchemica(
      testRealmId,
      "1"
    );
    expect(roundAlchemica[0]).to.gt(0);
    expect(roundAlchemica[1]).to.gt(0);
    expect(roundAlchemica[2]).to.gt(0);
    expect(roundAlchemica[3]).to.gt(0);
  });
});
