import {
  impersonate,
  mineBlocks,
  realmDiamondAddress,
  maticAavegotchiDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Alchemica, TestBeforeVars, UpgradeQueue } from "../../types";
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
import {
  RealmFacet,
  ERC721Facet,
  AlchemicaFacet,
  AavegotchiDiamond,
} from "../../typechain";
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-accessRightRefactor";
import {
  alchemica,
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
} from "../../constants";

describe("Access rights test", async function () {
  let parcelId = 141;
  let owner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let borrower = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  let otherOwner = "0x51208e5cC9215c6360210C48F81C8270637a5218";
  let gotchiId = 1484;
  let otherOwnerGotchi = 7622;

  const equipParcelId = 27843;

  let realmFacet: RealmFacet;
  let erc721Facet: ERC721Facet;
  let alchemicaFacet: AlchemicaFacet;
  let aavegotchiDiamond: AavegotchiDiamond;

  before(async function () {
    this.timeout(20000000);

    await upgradeRealm();

    aavegotchiDiamond = await ethers.getContractAt(
      "AavegotchiDiamond",
      maticAavegotchiDiamondAddress
    );

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticRealmDiamondAddress
    )) as RealmFacet;
    realmFacet = await impersonate(owner, realmFacet, ethers, network);

    alchemicaFacet = await ethers.getContractAt(
      "AlchemicaFacet",
      maticRealmDiamondAddress
    );
    alchemicaFacet = await impersonate(owner, alchemicaFacet, ethers, network);

    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      maticRealmDiamondAddress
    )) as ERC721Facet;
    erc721Facet = await impersonate(owner, erc721Facet, ethers, network);
  });
  it("Should allow access right upgrades for valid parameters", async function () {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 5; j++) {
        await realmFacet.setParcelsAccessRights([parcelId], [i], [j]);
        const accessRights = await realmFacet.getParcelsAccessRights(
          [parcelId],
          [i]
        );
        expect(accessRights[0]).to.equal(j);
      }
    }
  });
  it("Should not allow access right upgrades for invalid parameters", async function () {
    await expect(
      realmFacet.setParcelsAccessRights([parcelId], [8], [8])
    ).to.be.revertedWith("RealmFacet: Invalid access rights");
  });

  //Access Rights - Only Owner

  it("Should reset parcel access rights", async function () {
    for (let i = 0; i < 7; i++) {
      await realmFacet.setParcelsAccessRights([parcelId], [i], [0]);
      const accessRights = await realmFacet.getParcelsAccessRights(
        [parcelId],
        [i]
      );
      expect(accessRights[0]).to.equal(0);
    }
  });

  it("Owner can channel on their parcel", async () => {
    let lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);
    let sig = await genChannelAlchemicaSignature(
      parcelId,
      gotchiId,
      lastChanneled
    );
    await alchemicaFacet.channelAlchemica(
      parcelId,
      gotchiId,
      lastChanneled,
      sig
    );
    const lastChanneledAfter = await alchemicaFacet.getLastChanneled(gotchiId);
    expect(lastChanneledAfter.gt(lastChanneled));
  });

  it("Not Owner cannot channel on their parcel", async () => {
    await network.provider.send("evm_increaseTime", [86400 * 3]);

    await mineBlocks(ethers, 1000000000);

    alchemicaFacet = await impersonate(
      otherOwner,
      alchemicaFacet,
      ethers,
      network
    );
    const lastChanneled = await alchemicaFacet.getLastChanneled(
      otherOwnerGotchi
    );
    const sig = await genChannelAlchemicaSignature(
      parcelId,
      otherOwnerGotchi,
      lastChanneled
    );
    await expect(
      alchemicaFacet.channelAlchemica(
        parcelId,
        otherOwnerGotchi,
        lastChanneled,
        sig
      )
    ).to.be.revertedWith("LibRealm: Access Right - Only Owner");
  });

  //Access Rights - Only Owner / Borrowed Gotchi

  it("Channel alchemica with a borrowed gotchi", async function () {
    await network.provider.send("evm_increaseTime", [86400]);

    aavegotchiDiamond = await impersonate(
      owner,
      aavegotchiDiamond,
      ethers,
      network
    );

    //Update access rights to only owner/borrower
    await realmFacet.setParcelsAccessRights([parcelId], [0], [1]);

    let lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);

    let signature = await genChannelAlchemicaSignature(
      parcelId,
      gotchiId,
      lastChanneled
    );

    alchemicaFacet = await impersonate(
      borrower,
      alchemicaFacet,
      ethers,
      network
    );

    await expect(
      alchemicaFacet.channelAlchemica(
        parcelId,
        gotchiId,
        lastChanneled,
        signature
      )
    ).to.be.revertedWith("LibRealm: Access Right - Only Owner");

    await aavegotchiDiamond.addGotchiLending(
      gotchiId,
      0,
      1,
      [50, 50, 0],
      owner,
      ethers.constants.AddressZero,
      0,
      []
    );

    aavegotchiDiamond = await impersonate(
      borrower,
      aavegotchiDiamond,
      ethers,
      network
    );

    const lending = await aavegotchiDiamond.getGotchiLendingFromToken(gotchiId);

    await aavegotchiDiamond.agreeGotchiLending(
      lending.listingId,
      lending.erc721TokenId,
      lending.initialCost,
      lending.period,
      lending.revenueSplit
    );

    lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);

    signature = await genChannelAlchemicaSignature(
      parcelId,
      gotchiId,
      lastChanneled
    );

    await alchemicaFacet.channelAlchemica(
      parcelId,
      gotchiId,
      lastChanneled,
      signature
    );
  });

  it("Owner can still channel on their parcel", async () => {
    await network.provider.send("evm_increaseTime", [86400]);
    const lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);
    const sig = await genChannelAlchemicaSignature(
      parcelId,
      gotchiId,
      lastChanneled
    );
    await alchemicaFacet.channelAlchemica(
      parcelId,
      gotchiId,
      lastChanneled,
      sig
    );
    const lastChanneledAfter = await alchemicaFacet.getLastChanneled(gotchiId);
    expect(lastChanneledAfter.gt(lastChanneled));
  });

  //Access Rights - Only Owner / Borrowed Gotchi
  //Update access rights to only owner/borrower

  it("Owner can equip installations on their parcel", async () => {
    const equipSig = await genEquipInstallationSignature(
      equipParcelId,
      10,
      0,
      0
    );
    await realmFacet.equipInstallation(equipParcelId, 1484, 10, 0, 0, equipSig);
    await realmFacet.unequipInstallation(
      equipParcelId,
      1484,
      10,
      0,
      0,
      equipSig
    );
  });

  it("Borrowed Gotchi can equip on owners parcel", async () => {
    let installationFacet = await ethers.getContractAt(
      "InstallationFacet",
      maticInstallationDiamondAddress
    );

    await realmFacet.setParcelsAccessRights([equipParcelId], [2], [1]);

    realmFacet = await impersonate(borrower, realmFacet, ethers, network);

    installationFacet = await impersonate(
      borrower,
      installationFacet,
      ethers,
      network
    );
    await installationFacet.craftInstallations([10], [0]);

    const equipSig = await genEquipInstallationSignature(
      equipParcelId,
      10,
      0,
      0
    );

    await realmFacet.equipInstallation(equipParcelId, 1484, 10, 0, 0, equipSig);
  });

  it("Anyone can channel on parcel", async () => {
    realmFacet = await impersonate(owner, realmFacet, ethers, network);
    await realmFacet.setParcelsAccessRights([parcelId], [0], [4]);
    await network.provider.send("evm_increaseTime", [86400]);
    await mineBlocks(ethers, 100000000);

    const randomGotchiId = 8518;

    const lastChanneled = await alchemicaFacet.getLastChanneled(randomGotchiId);

    const channelSig = await genChannelAlchemicaSignature(
      parcelId,
      randomGotchiId,
      lastChanneled
    );

    alchemicaFacet = await impersonate(
      otherOwner,
      alchemicaFacet,
      ethers,
      network
    );
    await alchemicaFacet.channelAlchemica(
      parcelId,
      randomGotchiId,
      lastChanneled,
      channelSig
    );
  });
});
