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
import { TileTypeInput } from "../types";
import { outputTile } from "../scripts/realm/realmHelpers";

let diamondAddress: string;
let tileAddress: string;
let realmFacet: RealmFacet;
let tileFacet: TileFacet;
let erc721Facet: ERC721Facet;
let ownershipFacet: OwnershipFacet;
let ownerAddress: string;
let period: number;

describe("Realm Upgrade tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";

  before(async function () {
    this.timeout(20000000);

    // await upgrade();
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
  it.only("Test editDeprecateTime", async function () {
    const tileTypes: TileTypeInput[] = [
      {
        id: 4,
        name: "LE Golden Tile - Gotchi",
        width: 8,
        height: 8,
        deprecated: false,
        tileType: 0,
        alchemicaCost: [25, 25, 75, 25],
        craftTime: 0,
      },
    ];

    tileFacet = await impersonate(ownerAddress, tileFacet, ethers, network);
    const tile = outputTile(tileTypes[0]);

    await tileFacet.addTileTypes([tile]);

    await faucetRealAlchemica(testAddress, ethers, network);

    await approveRealAlchemica(testAddress, tileAddress, ethers, network);

    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    await tileFacet.craftTiles([4]);

    tileFacet = await impersonate(ownerAddress, tileFacet, ethers, network);
    await tileFacet.editDeprecateTime(4, 1655594972);

    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    period = 10 * 86400;

    await ethers.provider.send("evm_increaseTime", [period]);
    await ethers.provider.send("evm_mine", []);

    await expect(tileFacet.craftTiles([4])).to.be.revertedWith(
      "TileFacet: Tile has been deprecated"
    );
  });
});
