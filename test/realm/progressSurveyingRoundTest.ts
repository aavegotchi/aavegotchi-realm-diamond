import {
  impersonate,
  maticAavegotchiDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  AlchemicaFacet,
  InstallationFacet,
  OwnershipFacet,
  RealmFacet,
} from "../../typechain";
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-vrfTest";
import { alchemica, maticVars } from "../../constants";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  approveRealAlchemica,
  faucetRealAlchemica,
  genEquipInstallationSignature,
} from "../../scripts/realm/realmHelpers";

describe("Testing Progress Surveying Round", async function () {
  let alchemicaFacet: AlchemicaFacet;
  let alchemicaFacetWithOwner: AlchemicaFacet;
  let realmFacet: RealmFacet;
  let installationFacet: InstallationFacet;

  const testAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const testRealmId = 2258;
  const testGotchiId = 1484;
  const testReservoirId = 92;

  let harvestRatesBefore;
  let capacityBefore;

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
    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      diamondAddress
    )) as RealmFacet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      maticVars.installationDiamond
    )) as InstallationFacet;

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
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );

    const backendSigner = new ethers.Wallet(process.env.GBM_PK); // PK should start with '0x'
    await (
      await alchemicaFacetWithOwner.setVars(
        //@ts-ignore
        alchemicaTotals(),
        boostMultipliers,
        greatPortalCapacity,
        maticVars.installationDiamond,
        "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
        alchemica,
        ethers.constants.AddressZero,
        ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
        ethers.constants.AddressZero,
        maticVars.tileDiamond,
        maticAavegotchiDiamondAddress
      )
    ).wait();

    await faucetRealAlchemica(testAddress, ethers);
    await approveRealAlchemica(
      testAddress,
      maticVars.installationDiamond,
      ethers
    );
    await installationFacet.craftInstallations([testReservoirId], [0]);

    const sig = await genEquipInstallationSignature(
      testRealmId,
      testGotchiId,
      testReservoirId,
      0,
      0
    );
    await (
      await realmFacet.equipInstallation(
        testRealmId,
        testGotchiId,
        testReservoirId,
        0,
        0,
        sig
      )
    ).wait();

    harvestRatesBefore = await alchemicaFacet.getHarvestRates(testRealmId);
    capacityBefore = await installationFacet.getReservoirCapacity(
      testReservoirId
    );
  });

  it("Should revert test surveying first(current) round", async function () {
    await expect(
      alchemicaFacet.testingStartSurveying(testRealmId)
    ).to.be.revertedWith("AlchemicaFacet: Round not released");
  });

  it("Should start surveying and values same after progress round", async function () {
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

    const harvestRatesAfter = await alchemicaFacet.getHarvestRates(testRealmId);
    for (let i = 0; i < harvestRatesBefore.length; i++) {
      expect(harvestRatesAfter[i]).to.equal(harvestRatesBefore[i]);
    }

    const capacityAfter = await installationFacet.getReservoirCapacity(
      testReservoirId
    );
    expect(capacityAfter).to.equal(capacityBefore);
  });
});
