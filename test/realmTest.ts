import { impersonate } from "../scripts/helperFunctions";
import { RealmFacet, ERC721Facet } from "../typechain";
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
import { MintParcelInput } from "../types";

const { deployDiamond } = require("../scripts/deploy.ts");

const testAddress = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
const testAddress2 = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
let diamondAddress;
let realmFacet: RealmFacet;
let erc721Facet: ERC721Facet;
let accounts;

describe("Realm tests", async function () {
  before(async function () {
    this.timeout(20000000);
    diamondAddress = await deployDiamond();
    accounts = await ethers.getSigners();

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      diamondAddress
    )) as RealmFacet;
    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      diamondAddress
    )) as ERC721Facet;
  });

  it("Token symbol should be REALM", async function () {
    const symbol = await erc721Facet.symbol();
    expect(symbol).to.equal("REALM");
  });
  it("Token name should be Gotchiverse REALM Parcel", async function () {
    const name = await erc721Facet.name();
    expect(name).to.equal("Gotchiverse REALM Parcel");
  });
  it("Token metadata url should be https://aavegotchi.com/metadata/realm/0", async function () {
    const uri = await erc721Facet.tokenURI("0");
    expect(uri).to.equal("https://aavegotchi.com/metadata/realm/0");
  });

  it("Check that tokens are being minted", async function () {
    const parcelsTest1: MintParcelInput[] = [];
    const parcelsTest2: MintParcelInput[] = [];
    for (let i = 0; i < 4; i++) {
      const size = Math.floor(Math.random() * 5);
      const boostFomo = Math.floor(Math.random() * 4);
      const boostFud = Math.floor(Math.random() * 4);
      const boostKek = Math.floor(Math.random() * 4);
      const boostAlpha = Math.floor(Math.random() * 4);
      parcelsTest1.push({
        coordinateX: i,
        coordinateY: i,
        parcelId: i,
        size,
        fomoBoost: boostFomo,
        fudBoost: boostFud,
        kekBoost: boostKek,
        alphaBoost: boostAlpha,
      });
    }
    for (let i = 0; i < 6; i++) {
      const size = Math.floor(Math.random() * 5);
      const boostFomo = Math.floor(Math.random() * 4);
      const boostFud = Math.floor(Math.random() * 4);
      const boostKek = Math.floor(Math.random() * 4);
      const boostAlpha = Math.floor(Math.random() * 4);
      parcelsTest2.push({
        coordinateX: i,
        coordinateY: i,
        parcelId: i,
        size,
        fomoBoost: boostFomo,
        fudBoost: boostFud,
        kekBoost: boostKek,
        alphaBoost: boostAlpha,
      });
    }
    await realmFacet.mintParcels(testAddress, [5, 200, 33, 2], parcelsTest1);
    await realmFacet.mintParcels(
      testAddress2,
      [555, 7, 44, 0, 800, 6],
      parcelsTest2
    );
    await expect(
      realmFacet.mintParcels(testAddress, [0], [parcelsTest1[0]])
    ).to.be.revertedWith("ERC721: tokenId already minted");
    const balanceTest1 = await erc721Facet.balanceOf(testAddress);
    expect(balanceTest1).to.equal(parcelsTest1.length);
    const balanceTest2 = await erc721Facet.balanceOf(testAddress2);
    expect(balanceTest2).to.equal(parcelsTest2.length);
    const totalSupply = await erc721Facet.totalSupply();
    expect(totalSupply).to.equal(parcelsTest1.length + parcelsTest2.length);
  });
  it("Can transfer tokens", async function () {
    erc721Facet = await impersonate(testAddress, erc721Facet, ethers, network);
    const balancePreSender = await erc721Facet.balanceOf(testAddress);
    const balancePreReceiver = await erc721Facet.balanceOf(testAddress2);
    await erc721Facet["safeTransferFrom(address,address,uint256)"](
      testAddress,
      testAddress2,
      33
    );
    const balancePostSender = await erc721Facet.balanceOf(testAddress);
    const balancePostReceiver = await erc721Facet.balanceOf(testAddress2);
    expect(balancePostSender).to.equal(balancePreSender.sub(1));
    expect(balancePostReceiver).to.equal(balancePreReceiver.add(1));
  });
  it("Only owner can transfer", async function () {
    erc721Facet = await impersonate(testAddress, erc721Facet, ethers, network);
    await expect(
      erc721Facet["safeTransferFrom(address,address,uint256)"](
        testAddress,
        testAddress2,
        33
      )
    ).to.be.revertedWith("AavegotchiFacet: Not owner or approved to transfer");
  });

  it("Can batch transfer", async function () {
    const balancePreSender = await erc721Facet.balanceOf(testAddress);
    const balancePreReceiver = await erc721Facet.balanceOf(testAddress2);
    erc721Facet = await impersonate(testAddress, erc721Facet, ethers, network);
    await erc721Facet.safeBatchTransfer(
      testAddress,
      testAddress2,
      [5, 200],
      []
    );
    const balancePostSender = await erc721Facet.balanceOf(testAddress);
    const balancePostReceiver = await erc721Facet.balanceOf(testAddress2);
    expect(balancePostSender).to.equal(balancePreSender.sub(2));
    expect(balancePostReceiver).to.equal(balancePreReceiver.add(2));
  });
});
