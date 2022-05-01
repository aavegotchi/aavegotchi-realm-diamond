import { impersonate } from "../scripts/helperFunctions";
import {
  RealmFacet,
  ERC721Facet,
  OwnershipFacet,
  TileFacet,
} from "../typechain";
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
import {
  approveRealAlchemica,
  faucetRealAlchemica,
} from "../scripts/helperFunctions";
import { upgrade } from "../scripts/tile/upgrades/upgrade-deprecateTime";

let diamondAddress: string;
let tileAddress: string;
let realmFacet: RealmFacet;
let tileFacet: TileFacet;
let erc721Facet: ERC721Facet;
let ownershipFacet: OwnershipFacet;
let ownerAddress: string;

describe("Realm Upgrade tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";

  before(async function () {
    this.timeout(20000000);
    await upgrade();
    diamondAddress = "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";
    tileAddress = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      diamondAddress
    )) as RealmFacet;
    tileFacet = (await ethers.getContractAt(
      "TileFacet",
      tileAddress
    )) as TileFacet;
    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      diamondAddress
    )) as ERC721Facet;
    ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;

    ownerAddress = await ownershipFacet.owner();
  });

  it("Token symbol should be REALM", async function () {
    const symbol = await erc721Facet.symbol();
    expect(symbol).to.equal("REALM");
  });
  it("Token name should be Gotchiverse REALM Parcel", async function () {
    const name = await erc721Facet.name();
    expect(name).to.equal("Gotchiverse REALM Parcel");
  });
  it("Token metadata url should be https://app.aavegotchi.com/metadata/realm/0", async function () {
    const uri = await erc721Facet.tokenURI("0");
    expect(uri).to.equal("https://app.aavegotchi.com/metadata/realm/0");
  });

  it("Max supply should be 420,069", async function () {
    const maxSupply = await realmFacet.maxSupply();
    expect(maxSupply).to.equal(420069);
  });
  it("Test editDeprecateTime", async function () {
    await faucetRealAlchemica(testAddress, ethers, network);

    await approveRealAlchemica(testAddress, tileAddress, ethers, network);

    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    await tileFacet.craftTiles(["1"]);

    tileFacet = await impersonate(ownerAddress, tileFacet, ethers, network);
    await tileFacet.editDeprecateTime("1", "1650891972");

    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    await expect(tileFacet.craftTiles(["1"])).to.be.revertedWith(
      "TileFacet: Tile has been deprecated"
    );
  });
});
