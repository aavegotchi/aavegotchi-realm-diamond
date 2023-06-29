import { impersonate } from "../../scripts/helperFunctions";
import { RealmFacet, ERC721Facet } from "../../typechain";
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
import { MintParcelInput } from "../../types";
import { deployDiamond } from "../../scripts/deployMatic";

const testAddress1 = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
const testAddress2 = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
const tokenIdsTest1 = [5, 200, 33, 2];
const tokenIdsTest2 = [555, 7, 44, 0, 800, 6];
let diamondAddress;
let realmFacet: RealmFacet;
let erc721Facet: ERC721Facet;
let accounts;
let ownerAddress: string;
let parcelsTest1: MintParcelInput[] = [];
let parcelsTest2: MintParcelInput[] = [];

describe("Realm tests", async function () {
  before(async function () {
    this.timeout(20000000);
    diamondAddress = await deployDiamond();
    accounts = await ethers.getSigners();
    ownerAddress = accounts[0].address;

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

  it("Max supply should be 420,069", async function () {
    const maxSupply = await realmFacet.maxSupply();
    expect(maxSupply).to.equal(420069);
  });

  it("Check that tokens are being minted", async function () {
    for (let i = 0; i < 4; i++) {
      const size = Math.floor(Math.random() * 5);
      const boostFomo = Math.floor(Math.random() * 4);
      const boostFud = Math.floor(Math.random() * 4);
      const boostKek = Math.floor(Math.random() * 4);
      const boostAlpha = Math.floor(Math.random() * 4);
      parcelsTest1.push({
        coordinateX: i,
        coordinateY: i,
        parcelId: i.toString(),
        size,
        boost: [boostFud, boostFomo, boostAlpha, boostKek],
        district: 1,
        parcelAddress: "hey-whats-up",
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
        parcelId: i.toString(),
        size,
        boost: [boostFud, boostFomo, boostAlpha, boostKek],
        district: 1,
        parcelAddress: "hey-whats-up",
      });
    }
    await realmFacet.mintParcels(testAddress1, tokenIdsTest1, parcelsTest1);
    await realmFacet.mintParcels(testAddress2, tokenIdsTest2, parcelsTest2);
    await expect(
      realmFacet.mintParcels(testAddress1, [0], [parcelsTest1[0]])
    ).to.be.revertedWith("ERC721: tokenId already minted");
  });
  it("Test ERC721 view functions", async function () {
    const balanceTest1 = await erc721Facet.balanceOf(testAddress1);
    expect(balanceTest1).to.equal(parcelsTest1.length);
    const balanceTest2 = await erc721Facet.balanceOf(testAddress2);
    expect(balanceTest2).to.equal(parcelsTest2.length);
    const totalSupply = await erc721Facet.totalSupply();
    expect(totalSupply).to.equal(parcelsTest1.length + parcelsTest2.length);
    const tokenIdsOfOwner1 = await erc721Facet.tokenIdsOfOwner(testAddress1);
    const tokenIdsOfOwner2 = await erc721Facet.tokenIdsOfOwner(testAddress2);
    expect(tokenIdsTest1.length).to.equal(tokenIdsOfOwner1.length);
    expect(tokenIdsTest2.length).to.equal(tokenIdsOfOwner2.length);
    for (let i = 0; i < tokenIdsOfOwner1.length; i++) {
      expect(tokenIdsTest1[i]).to.equal(Number(tokenIdsOfOwner1[i]));
    }
    for (let i = 0; i < tokenIdsOfOwner2.length; i++) {
      expect(tokenIdsTest2[i]).to.equal(Number(tokenIdsOfOwner2[i]));
    }
  });
  it("Can transfer tokens", async function () {
    let tokenIdsOfReceiver = await erc721Facet.tokenIdsOfOwner(testAddress2);

    erc721Facet = await impersonate(testAddress1, erc721Facet, ethers, network);
    const balancePreSender = await erc721Facet.balanceOf(testAddress1);
    const balancePreReceiver = await erc721Facet.balanceOf(testAddress2);
    await erc721Facet.safeBatchTransfer(
      testAddress1,
      testAddress2,
      [33, 5, 200],
      []
    );
    const balancePostSender = await erc721Facet.balanceOf(testAddress1);
    const balancePostReceiver = await erc721Facet.balanceOf(testAddress2);
    expect(balancePostSender).to.equal(balancePreSender.sub(3));
    expect(balancePostReceiver).to.equal(balancePreReceiver.add(3));

    tokenIdsOfReceiver = await erc721Facet.tokenIdsOfOwner(testAddress2);
    expect(tokenIdsOfReceiver[6].toString()).to.equal("33");
  });
  it("Only owner can transfer", async function () {
    erc721Facet = await impersonate(testAddress1, erc721Facet, ethers, network);
    await expect(
      erc721Facet["safeTransferFrom(address,address,uint256)"](
        testAddress1,
        testAddress2,
        33
      )
    ).to.be.revertedWith("LibERC721: Not owner or approved to transfer");
  });

  /*
  it("Can batch transfer", async function () {
    const balancePreSender = await erc721Facet.balanceOf(testAddress1);
    const balancePreReceiver = await erc721Facet.balanceOf(testAddress2);
    erc721Facet = await impersonate(testAddress1, erc721Facet, ethers, network);
    await erc721Facet.safeBatchTransfer(
      testAddress1,
      testAddress2,
      [5, 200],
      []
    );
    const balancePostSender = await erc721Facet.balanceOf(testAddress1);
    const balancePostReceiver = await erc721Facet.balanceOf(testAddress2);
    expect(balancePostSender).to.equal(balancePreSender.sub(2));
    expect(balancePostReceiver).to.equal(balancePreReceiver.add(2));
  });
  */
  it("Cannot batch transfer tokens not owned", async function () {
    erc721Facet = await impersonate(testAddress1, erc721Facet, ethers, network);
    await expect(
      erc721Facet.safeBatchTransfer(testAddress1, testAddress2, [5, 200], [])
    ).to.be.revertedWith("LibERC721: Not owner or approved to transfer");
  });
  it("Test approval", async function () {
    erc721Facet = await impersonate(testAddress1, erc721Facet, ethers, network);
    await erc721Facet.setApprovalForAll(ownerAddress, true);
    erc721Facet = await impersonate(ownerAddress, erc721Facet, ethers, network);
    const balancePreSender = await erc721Facet.balanceOf(testAddress1);
    const balancePreReceiver = await erc721Facet.balanceOf(testAddress2);
    const ownerOfPre = await erc721Facet.ownerOf(2);
    expect(ownerOfPre).to.equal(testAddress1);
    await erc721Facet["safeTransferFrom(address,address,uint256)"](
      testAddress1,
      testAddress2,
      2
    );
    const ownerOfPost = await erc721Facet.ownerOf(2);
    expect(ownerOfPost).to.equal(testAddress2);
    const balancePostSender = await erc721Facet.balanceOf(testAddress1);
    const balancePostReceiver = await erc721Facet.balanceOf(testAddress2);
    expect(balancePostSender).to.equal(balancePreSender.sub(1));
    expect(balancePostReceiver).to.equal(balancePreReceiver.add(1));
  });
});
