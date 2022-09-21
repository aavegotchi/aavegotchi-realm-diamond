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
  InstallationFacet,
  RealmFacet,
  TileFacet,
  OwnershipFacet,
  AlchemicaFacet,
  AavegotchiDiamond,
} from "../../typechain";
import {
  approveAlchemica,
  mintAlchemica,
  genEquipInstallationSignature,
  genChannelAlchemicaSignature,
  genUpgradeInstallationSignature,
} from "../../scripts/realm/realmHelpers";
import { TestBeforeVars, UpgradeQueue } from "../../types";
import { impersonate } from "../../scripts/helperFunctions";
import { upgradeChannelingRestrictions } from "../../scripts/alchemica/upgradeChannelingRestrictions";

describe("Channeling Restrictions during Lending Listing", async function () {
  //   const testAddress = "0xDd564df884Fd4e217c9ee6F65B4BA6e5641eAC63";
  //   const testParcelId = 2893;
  //   const testGotchiId = 22306;
  //   const testGotchiId2 = 23491;
  //   const testGotchiId3 = 19652;
  let parcelId = 141;
  let gotchiId = 1484;
  let ownerAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const otherAddress = "0x51208e5cC9215c6360210C48F81C8270637a5218";
  const otherGotchi = 2575;
  const otherParcelId = 3783;
  const unlockedAavegotchiId = 21655;

  let realmFacet: RealmFacet;
  let alchemicaFacet: AlchemicaFacet;
  let ownershipFacet: OwnershipFacet;
  let aavegotchiDiamond: AavegotchiDiamond;
  let g: TestBeforeVars;
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

    // g.alchemicaFacet = await impersonate(
    //   g.ownerAddress,
    //   g.alchemicaFacet,
    //   ethers,
    //   network
    // );

    // await g.alchemicaFacet.setChannelingLimits([1, 2], [86400, 64800]);

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

  it("Should NOT channel Alchemica when gotchi is listed for lending", async function () {
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

    await aavegotchiDiamond.agreeGotchiLending(
      await aavegotchiDiamond.getGotchiLendingsLength(),
      otherGotchi,
      initialCost,
      period,
      revenueSplitWithoutThirdParty
    );
  });
});
