import { ethers, network } from "hardhat";
import { BigNumberish } from "ethers";
import { varsForNetwork, alchemica } from "../../constants";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import { expect } from "chai";
import {
  RealmFacet,
  OwnershipFacet,
  AlchemicaFacet,
  AavegotchiDiamond,
} from "../../typechain";
import { genChannelAlchemicaSignature } from "../../scripts/realm/realmHelpers";
import { impersonate } from "../../scripts/helperFunctions";
import { upgradeChannelingRestrictions } from "../../scripts/alchemica/upgradeChannelingRestrictions";

describe("Channeling Restrictions during Lending Listing", async function () {
  let parcelId = 141;
  let gotchiId = 1484;
  let ownerAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const otherAddress = "0x51208e5cC9215c6360210C48F81C8270637a5218";
  const otherGotchi = 2575;
  const otherParcelId = 3783;

  let realmFacet: RealmFacet;
  let alchemicaFacet: AlchemicaFacet;
  let aavegotchiDiamond: AavegotchiDiamond;
  let c;

  const initialCost = ethers.utils.parseUnits("1", "ether");
  const period = 10 * 86400; // 10 days
  const revenueSplitWithoutThirdParty: [
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [50, 50, 0];

  before(async function () {
    this.timeout(20000000);

    upgradeChannelingRestrictions();

    c = await varsForNetwork(ethers);

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond
    )) as RealmFacet;

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      c.realmDiamond
    )) as AlchemicaFacet;

    const realmOwnershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      c.realmDiamond
    )) as OwnershipFacet;

    const realmOwner = await realmOwnershipFacet.owner();
    alchemicaFacet = await impersonate(
      realmOwner,
      await ethers.getContractAt("AlchemicaFacet", c.realmDiamond),
      ethers,
      network
    );
    const backendSigner = new ethers.Wallet(process.env.PROD_PK);

    await alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      c.installationDiamond,
      "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
      "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
      alchemica,
      ethers.constants.AddressZero,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      ethers.constants.AddressZero,
      c.tileDiamond,
      c.aavegotchiDiamond
    );
  });

  it("Should channel Alchemica", async function () {
    const lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId);

    const signature = await genChannelAlchemicaSignature(
      parcelId,
      gotchiId,
      lastChanneled
    );

    aavegotchiDiamond = await impersonate(
      ownerAddress,
      await ethers.getContractAt("AavegotchiDiamond", c.aavegotchiDiamond),
      ethers,
      network
    );

    let isLent = await aavegotchiDiamond.isAavegotchiLent(gotchiId);
    console.log("Gotchi is Lent: ", isLent);

    alchemicaFacet = await impersonate(
      ownerAddress,
      await ethers.getContractAt("AlchemicaFacet", c.realmDiamond),
      ethers,
      network
    );

    await alchemicaFacet.channelAlchemica(
      parcelId,
      gotchiId,
      lastChanneled,
      signature
    );
  });

  it("Should NOT channel Alchemica when gotchi is listed for lending, ONLY when gotchi is lent", async function () {
    const lastChanneled = await alchemicaFacet.getLastChanneled(otherGotchi);

    const signature = await genChannelAlchemicaSignature(
      otherParcelId,
      otherGotchi,
      lastChanneled
    );

    aavegotchiDiamond = await impersonate(
      otherAddress,
      await ethers.getContractAt("AavegotchiDiamond", c.aavegotchiDiamond),
      ethers,
      network
    );

    let isLent = await aavegotchiDiamond.isAavegotchiLent(otherGotchi);
    console.log("Gotchi is Lent: ", isLent);

    await aavegotchiDiamond.addGotchiLending(
      otherGotchi,
      initialCost,
      period,
      revenueSplitWithoutThirdParty,
      c.aavegotchiDiamond,
      ethers.constants.AddressZero,
      0,
      []
    );

    alchemicaFacet = await impersonate(
      otherAddress,
      await ethers.getContractAt("AlchemicaFacet", c.realmDiamond),
      ethers,
      network
    );

    await expect(
      alchemicaFacet.channelAlchemica(
        otherParcelId,
        otherGotchi,
        lastChanneled,
        signature
      )
    ).to.be.revertedWith(
      "AavegotchiDiamond: Gotchi CANNOT have active listing for lending"
    );

    aavegotchiDiamond = await impersonate(
      ownerAddress,
      await ethers.getContractAt("AavegotchiDiamond", c.aavegotchiDiamond),
      ethers,
      network
    );

    await aavegotchiDiamond.agreeGotchiLending(
      await aavegotchiDiamond.getGotchiLendingsLength(),
      otherGotchi,
      initialCost,
      period,
      revenueSplitWithoutThirdParty
    );

    await alchemicaFacet.channelAlchemica(
      otherParcelId,
      otherGotchi,
      lastChanneled,
      signature
    );
  });
});
