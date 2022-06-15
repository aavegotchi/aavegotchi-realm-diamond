import {
  impersonate,
  mineBlocks,
  realmDiamondAddress,
  maticAavegotchiDiamondAddress,
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
  mintAlchemica,
  genClaimAlchemicaSignature,
  genEquipInstallationSignature,
  testInstallations,
  genChannelAlchemicaSignature,
} from "../../scripts/realm/realmHelpers";
import { RealmFacet } from "../../typechain";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-accessRightTransferReset";

describe("Access rights test", async function () {
  let parcelId = 15882;
  let realm;

  before(async function () {
    this.timeout(20000000);

    await upgrade();

    realm = (await ethers.getContractAt(
      "RealmFacet",
      "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11"
    )) as RealmFacet;
    realm = await impersonate(
      "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B",
      realm,
      ethers,
      network
    );
  });
  it("Should allow access right upgrades for valid parameters", async function () {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 5; j++) {
        await realm.setParcelsAccessRights([parcelId], [i], [j]);
        const accessRights = await realm.getParcelsAccessRights(
          [parcelId],
          [i]
        );
        expect(accessRights[0]).to.equal(j);
      }
    }
  });
  it("Should not allow access right upgrades for invalid parameters", async function () {
    await expect(
      realm.setParcelsAccessRights([parcelId], [8], [8])
    ).to.be.revertedWith("RealmFacet: Invalid access rights");
  });
});
