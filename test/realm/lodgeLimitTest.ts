import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
  realmDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { TestBeforeVars, UpgradeQueue } from "../../types";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  approveAlchemica,
  beforeTest,
  faucetAlchemica,
  genEquipInstallationSignature,
  testInstallations,
} from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress(network.name));
  });
  it("Setup installation diamond", async function () {
    g.installationDiamond = await impersonate(
      g.installationOwner,
      g.installationDiamond,
      ethers,
      network
    );

    let installationsTypes = await g.installationDiamond.getInstallationTypes(
      []
    );

    await g.installationAdminFacet.addInstallationTypes(testInstallations());
    installationsTypes = await g.installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(testInstallations().length);
  });
  it("Craft installations", async function () {
    g.installationDiamond = await impersonate(
      testAddress,
      g.installationDiamond,
      ethers,
      network
    );
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    await expect(
      g.installationDiamond.craftInstallations([8, 8])
    ).to.be.revertedWith("ERC20: insufficient allowance");

    await faucetAlchemica(g.alchemicaFacet, "20000");

    await approveAlchemica(g, ethers, testAddress, network);

    await g.installationDiamond.craftInstallations([8, 8]);

    await mineBlocks(ethers, 11000);

    await g.installationDiamond.claimInstallations([0, 1]);
  });
  it("Survey Parcel", async function () {
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Test Lodge Limit", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      8,
      0,
      0,
      await genEquipInstallationSignature(8, 0, 0, testParcelId)
    );
    await expect(
      g.realmFacet.equipInstallation(
        testParcelId,
        8,
        3,
        3,
        await genEquipInstallationSignature(8, 3, 3, testParcelId)
      )
    ).to.be.revertedWith("RealmFacet: Lodge already equipped");
    await g.realmFacet.unequipInstallation(
      testParcelId,
      8,
      0,
      0,
      await genEquipInstallationSignature(8, 0, 0, testParcelId)
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      8,
      0,
      0,
      await genEquipInstallationSignature(8, 0, 0, testParcelId)
    );
    await expect(
      g.realmFacet.equipInstallation(
        testParcelId,
        8,
        3,
        3,
        await genEquipInstallationSignature(8, 3, 3, testParcelId)
      )
    ).to.be.revertedWith("RealmFacet: Lodge already equipped");
  });
});
