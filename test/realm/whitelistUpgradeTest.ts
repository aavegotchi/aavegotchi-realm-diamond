import {
  impersonate,
  maticAavegotchiDiamondAddress,
  mineBlocks,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  AavegotchiDiamond,
  AlchemicaFacet,
  InstallationFacet,
  OwnershipFacet,
  RealmFacet,
  RealmGettersAndSettersFacet,
} from "../../typechain";
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-whitelist";
import { alchemica, varsForNetwork } from "../../constants";
import {
  genChannelAlchemicaSignature,
  genEquipInstallationSignature,
} from "../../scripts/realm/realmHelpers";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";

describe("Whitelist test", async function () {
  let parcelId = 141;
  let gotchiId = 16911;
  let otherOwnerGotchi = 7622;
  const equipParcelId = 27843;
  const ownerInstallationId = 45;
  const borrowerInstallationId = 1;
  const ownerAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5"; // should be owner of parcel, installation and gotchi
  const borrowerAddress = "0x51208e5cC9215c6360210C48F81C8270637a5218"; // borrower should be GHST holder, whitelisted during test, should be owner of an installation
  const nonWhitelistedAddress = "0xaA3B1fDC3Aa57Bf24418E397f8c80e7385aAa594"; // non-whitelisted address should be GHST holder

  let realmGettersAndSettersFacet: RealmGettersAndSettersFacet;
  let realmFacet: RealmFacet;
  let installationFacet: InstallationFacet;
  let alchemicaFacet: AlchemicaFacet;
  let aavegotchiDiamond: AavegotchiDiamond;

  let whitelistId: any;
  let secondWhitelistId: any;

  before(async function () {
    this.timeout(20000000);

    await upgradeRealm();

    const c = await varsForNetwork(ethers);
    const maticDiamondAddress = c.realmDiamond;
    const maticInstallationDiamondAddress = c.installationDiamond;
    const maticTileDiamondAddress = c.tileDiamond;

    const accounts = await ethers.getSigners();
    const signer2 = accounts[1];
    const signer2Address = await signer2.getAddress();

    aavegotchiDiamond = await ethers.getContractAt(
      "AavegotchiDiamond",
      maticAavegotchiDiamondAddress
    );

    realmGettersAndSettersFacet = (await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      maticDiamondAddress
    )) as RealmGettersAndSettersFacet;
    realmGettersAndSettersFacet = await impersonate(
      ownerAddress,
      realmGettersAndSettersFacet,
      ethers,
      network
    );

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;
    realmFacet = await impersonate(ownerAddress, realmFacet, ethers, network);

    alchemicaFacet = await ethers.getContractAt(
      "AlchemicaFacet",
      maticDiamondAddress
    );
    alchemicaFacet = await impersonate(
      ownerAddress,
      alchemicaFacet,
      ethers,
      network
    );

    installationFacet = await ethers.getContractAt(
      "InstallationFacet",
      maticInstallationDiamondAddress
    );
    installationFacet = await impersonate(
      borrowerAddress,
      installationFacet,
      ethers,
      network
    );

    // this is for test
    const realmOwnershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      maticDiamondAddress
    )) as OwnershipFacet;
    const realmOwner = await realmOwnershipFacet.owner();
    const backendSigner = new ethers.Wallet(process.env.PROD_PK);
    const alchemicaFacetWithOwner = await impersonate(
      realmOwner,
      alchemicaFacet,
      ethers,
      network
    );
    await (
      await alchemicaFacetWithOwner.setVars(
        //@ts-ignore
        alchemicaTotals(),
        boostMultipliers,
        greatPortalCapacity,
        maticInstallationDiamondAddress,
        "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
        alchemica,
        ethers.constants.AddressZero,
        ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
        ethers.constants.AddressZero,
        maticTileDiamondAddress,
        maticAavegotchiDiamondAddress
      )
    ).wait();
    // transfer gotchi for test
    const gotchiOwnerAddress = "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7";
    let gotchiDiamond = await ethers.getContractAt(
      "IERC721",
      maticAavegotchiDiamondAddress
    );
    gotchiDiamond = await impersonate(
      gotchiOwnerAddress,
      gotchiDiamond,
      ethers,
      network
    );
    await gotchiDiamond["safeTransferFrom(address,address,uint256)"](
      gotchiOwnerAddress,
      ownerAddress,
      gotchiId
    );
    // create whitelist in aavegotchi diamond
    const aavegotchiDiamondWithSigner1 = await impersonate(
      ownerAddress,
      aavegotchiDiamond,
      ethers,
      network
    );
    await (
      await aavegotchiDiamondWithSigner1.createWhitelist("test1", [
        borrowerAddress,
      ])
    ).wait();
    whitelistId = await aavegotchiDiamondWithSigner1.getWhitelistsLength();
    const aavegotchiDiamondWithSigner2 = await impersonate(
      signer2Address,
      aavegotchiDiamond,
      ethers,
      network
    );
    await (
      await aavegotchiDiamondWithSigner2.createWhitelist("test2", [
        nonWhitelistedAddress,
      ])
    ).wait();
    secondWhitelistId =
      await aavegotchiDiamondWithSigner2.getWhitelistsLength();
  });

  describe("Testing setParcelsAccessRights and getParcelsAccessRights", async function () {
    it("Should allow access right upgrades for valid parameters", async function () {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 5; j++) {
          await realmGettersAndSettersFacet.setParcelsAccessRights(
            [parcelId],
            [i],
            [j]
          );
          const accessRights =
            await realmGettersAndSettersFacet.getParcelsAccessRights(
              [parcelId],
              [i]
            );
          expect(accessRights[0]).to.equal(j);
        }
      }
    });
    it("Should not allow access right upgrades for invalid parameters", async function () {
      await expect(
        realmGettersAndSettersFacet.setParcelsAccessRights([parcelId], [8], [8])
      ).to.be.revertedWith(
        "RealmGettersAndSettersFacet: Invalid access rights"
      );
    });
    it("Should reset parcel access rights", async function () {
      //Access Rights - Only Owner
      for (let i = 0; i < 7; i++) {
        await realmGettersAndSettersFacet.setParcelsAccessRights(
          [parcelId],
          [i],
          [0]
        );
        const accessRights =
          await realmGettersAndSettersFacet.getParcelsAccessRights(
            [parcelId],
            [i]
          );
        expect(accessRights[0]).to.equal(0);
      }
    });
  });

  describe("Testing setParcelsWhitelists", async function () {
    it("Should not allow if not invalid array length", async function () {
      await expect(
        realmGettersAndSettersFacet.setParcelsWhitelists(
          [parcelId],
          [0],
          [whitelistId, 9]
        )
      ).to.be.revertedWith("RealmGettersAndSettersFacet: Mismatched arrays");
    });
    it("Should not allow if invalid access right", async function () {
      await expect(
        realmGettersAndSettersFacet.setParcelsWhitelists(
          [parcelId],
          [9],
          [whitelistId]
        )
      ).to.be.revertedWith(
        "RealmGettersAndSettersFacet: Invalid access rights"
      );
    });
    it("Should not allow if invalid whitelist owner", async function () {
      await expect(
        realmGettersAndSettersFacet.setParcelsWhitelists(
          [parcelId],
          [0],
          [secondWhitelistId]
        )
      ).to.be.revertedWith("RealmGettersAndSettersFacet: Not whitelist owner");
    });
    it("Should not allow if invalid parcel owner", async function () {
      const realmGettersAndSettersFacetWithNonParcelOwner = await impersonate(
        nonWhitelistedAddress,
        realmGettersAndSettersFacet,
        ethers,
        network
      );
      await expect(
        realmGettersAndSettersFacetWithNonParcelOwner.setParcelsWhitelists(
          [parcelId],
          [0],
          [whitelistId]
        )
      ).to.be.revertedWith(
        "RealmGettersAndSettersFacet: Only Parcel owner can call"
      );
    });
    it("Should allow setting parcel whitelist for valid parameters", async function () {
      const receipt = await (
        await realmGettersAndSettersFacet.setParcelsWhitelists(
          [parcelId],
          [0],
          [whitelistId]
        )
      ).wait();
      let event = receipt!.events!.find(
        (event) => event.event === "ParcelAccessRightSet"
      );
      expect(event!.args!._realmId).to.equal(parcelId);
      expect(event!.args!._actionRight).to.equal(0);
      expect(event!.args!._accessRight).to.equal(2);
      event = receipt!.events!.find(
        (event) => event.event === "ParcelWhitelistSet"
      );
      expect(event!.args!._realmId).to.equal(parcelId);
      expect(event!.args!._actionRight).to.equal(0);
      expect(event!.args!._whitelistId).to.equal(whitelistId);
    });
  });

  describe("Testing actionRights and accessRights after upgrade", async function () {
    describe("Testing accessRights are 0 (Owner only)", async function () {
      it("Owner can channel on their parcel", async () => {
        await realmGettersAndSettersFacet.setParcelsAccessRights(
          [parcelId],
          [0],
          [0]
        );

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
        const lastChanneledAfter = await alchemicaFacet.getLastChanneled(
          gotchiId
        );
        expect(lastChanneledAfter.gt(lastChanneled));
      });
      it("Not Owner cannot channel on their parcel", async () => {
        await network.provider.send("evm_increaseTime", [86400 * 3]);
        await mineBlocks(ethers, 1000000000);

        const alchemicaFacetWithNonOwner = await impersonate(
          borrowerAddress,
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
          alchemicaFacetWithNonOwner.channelAlchemica(
            parcelId,
            otherOwnerGotchi,
            lastChanneled,
            sig
          )
        ).to.be.revertedWith("LibRealm: Access Right - Only Owner");
      });
    });

    describe("Testing accessRights are 2 (Whitelisted addresses)", async function () {
      it("Should revert if channel alchemica with a non whitelisted address", async function () {
        await network.provider.send("evm_increaseTime", [86400]);
        //Update actionRight and whitelistId for a parcel
        await realmGettersAndSettersFacet.setParcelsWhitelists(
          [parcelId],
          [0],
          [whitelistId]
        );

        // channel with non whitelisted address
        const lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);
        const signature = await genChannelAlchemicaSignature(
          parcelId,
          gotchiId,
          lastChanneled
        );
        const alchemicaFacetWithNonWhitelisted = await impersonate(
          nonWhitelistedAddress,
          alchemicaFacet,
          ethers,
          network
        );
        await expect(
          alchemicaFacetWithNonWhitelisted.channelAlchemica(
            parcelId,
            gotchiId,
            lastChanneled,
            signature
          )
        ).to.be.revertedWith("LibRealm: Access Right - Only Whitelisted");
      });
      it("Should succeed if channel alchemica with a whitelisted address", async function () {
        // channel with whitelisted address
        const lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);
        const signature = await genChannelAlchemicaSignature(
          parcelId,
          gotchiId,
          lastChanneled
        );
        const alchemicaFacetWithWhitelisted = await impersonate(
          borrowerAddress,
          alchemicaFacet,
          ethers,
          network
        );
        await alchemicaFacetWithWhitelisted.channelAlchemica(
          parcelId,
          gotchiId,
          lastChanneled,
          signature
        );
      });
      it("Should succeed if whitelisted address equip installations on parcel", async () => {
        await realmGettersAndSettersFacet.setParcelsWhitelists(
          [equipParcelId],
          [2],
          [whitelistId]
        );
        const equipSig = await genEquipInstallationSignature(
          equipParcelId,
          gotchiId,
          borrowerInstallationId,
          0,
          0
        );
        const realmFacetWithWhitelisted = await impersonate(
          borrowerAddress,
          realmFacet,
          ethers,
          network
        );
        const snapshot = await ethers.provider.send("evm_snapshot", []); // snapshot parcel for next tests
        await realmFacetWithWhitelisted.equipInstallation(
          equipParcelId,
          gotchiId,
          borrowerInstallationId,
          0,
          0,
          equipSig
        );
        await ethers.provider.send("evm_revert", [snapshot]); // rollback snapshot of parcel for next tests
      });
    });

    describe("Testing accessRights are 1 (Owner + Borrowed Gotchis)", async function () {
      //Access Rights - Only Owner / Borrowed Gotchi
      it("Should revert if channel alchemica with a non-borrowed gotchi", async function () {
        await network.provider.send("evm_increaseTime", [86400]);

        //Update access rights to only ownerAddress/borrowerAddress
        await realmGettersAndSettersFacet.setParcelsAccessRights(
          [parcelId],
          [0],
          [1]
        );

        // channel with non ownerAddress or borrowerAddress
        const lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);
        const signature = await genChannelAlchemicaSignature(
          parcelId,
          gotchiId,
          lastChanneled
        );
        const alchemicaFacetWithBorrower = await impersonate(
          borrowerAddress,
          alchemicaFacet,
          ethers,
          network
        );
        await expect(
          alchemicaFacetWithBorrower.channelAlchemica(
            parcelId,
            gotchiId,
            lastChanneled,
            signature
          )
        ).to.be.revertedWith("LibRealm: Access Right - Only Owner");
      });
      it("Should succeed if channel alchemica with a borrowed gotchi", async function () {
        // add gotchi lending if not lent
        aavegotchiDiamond = await impersonate(
          ownerAddress,
          aavegotchiDiamond,
          ethers,
          network
        );
        await aavegotchiDiamond.addGotchiLending(
          gotchiId,
          0,
          1,
          [50, 50, 0],
          ownerAddress,
          ethers.constants.AddressZero,
          0,
          []
        );
        const lending = await aavegotchiDiamond.getGotchiLendingFromToken(
          gotchiId
        );
        aavegotchiDiamond = await impersonate(
          borrowerAddress,
          aavegotchiDiamond,
          ethers,
          network
        );
        await aavegotchiDiamond.agreeGotchiLending(
          lending.listingId,
          lending.erc721TokenId,
          lending.initialCost,
          lending.period,
          lending.revenueSplit
        );

        // channel with borrowerAddress
        const lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);
        const signature = await genChannelAlchemicaSignature(
          parcelId,
          gotchiId,
          lastChanneled
        );
        const alchemicaFacetWithBorrower = await impersonate(
          borrowerAddress,
          alchemicaFacet,
          ethers,
          network
        );
        await alchemicaFacetWithBorrower.channelAlchemica(
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
        const lastChanneledAfter = await alchemicaFacet.getLastChanneled(
          gotchiId
        );
        expect(lastChanneledAfter.gt(lastChanneled));
      });
      it("Owner can equip or unequip installations on their parcel", async () => {
        //Update access rights to only ownerAddress/borrowerAddress
        await realmGettersAndSettersFacet.setParcelsAccessRights(
          [equipParcelId],
          [2],
          [1]
        );
        const equipSig = await genEquipInstallationSignature(
          equipParcelId,
          gotchiId,
          ownerInstallationId,
          0,
          0
        );
        await realmFacet.equipInstallation(
          equipParcelId,
          gotchiId,
          ownerInstallationId,
          0,
          0,
          equipSig
        );
        await realmFacet.unequipInstallation(
          equipParcelId,
          gotchiId,
          ownerInstallationId,
          0,
          0,
          equipSig
        );
      });
      it("Should succeed if borrower equip installations on parcel", async () => {
        const equipSig = await genEquipInstallationSignature(
          equipParcelId,
          gotchiId,
          borrowerInstallationId,
          0,
          0
        );
        const realmFacetWithBorrower = await impersonate(
          borrowerAddress,
          realmFacet,
          ethers,
          network
        );
        await realmFacetWithBorrower.equipInstallation(
          equipParcelId,
          gotchiId,
          borrowerInstallationId,
          0,
          0,
          equipSig
        );
      });
    });

    describe("Testing accessRights are 4 (Any Gotchi)", async function () {
      it("Anyone can channel on parcel", async () => {
        await realmGettersAndSettersFacet.setParcelsAccessRights(
          [parcelId],
          [0],
          [4]
        );
        await network.provider.send("evm_increaseTime", [86400]);
        await mineBlocks(ethers, 100000000);

        const randomGotchiId = 8518;

        const lastChanneled = await alchemicaFacet.getLastChanneled(
          randomGotchiId
        );

        const channelSig = await genChannelAlchemicaSignature(
          parcelId,
          randomGotchiId,
          lastChanneled
        );

        alchemicaFacet = await impersonate(
          borrowerAddress,
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
  });
});
