import { impersonate } from "../../scripts/helperFunctions";
import {
  TileFacet,
  ERC1155Facet,
  IERC20,
  OwnershipFacet,
} from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { upgrade } from "../../scripts/tile/upgrades/upgrade-addDeprecateTimeToAddTileTypes";
import { BigNumberish } from "ethers";
import { maticGhstAddress } from "../../scripts/tile/helperFunctions";
import { maticVars } from "../../constants";

describe("Tile deprecation time tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  let diamondAddress: string;
  let tileFacet: TileFacet;
  let erc1155Facet: ERC1155Facet;
  let ghst: IERC20;
  let startTileId: number;

  before(async function () {
    this.timeout(20000000);

    await upgrade();

    diamondAddress = maticVars.tileDiamond;

    const ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;
    const owner = await ownershipFacet.owner();

    tileFacet = (await ethers.getContractAt(
      "TileFacet",
      diamondAddress
    )) as TileFacet;
    tileFacet = await impersonate(owner, tileFacet, ethers, network);

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155Facet",
      diamondAddress
    )) as ERC1155Facet;

    console.log("diamond address:", diamondAddress);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;
  });

  it("Should emit EditDeprecateTime when add tile types with deprecateTime", async function () {
    const oldTilesTypes = await tileFacet.getTileTypes([]);
    startTileId = oldTilesTypes.length;

    const tiles = [
      {
        name: "LE Golden Tile - Gotchi",
        width: 8,
        height: 8,
        deprecated: false,
        tileType: 0,
        alchemicaCost: [25, 25, 75, 25] as [
          BigNumberish,
          BigNumberish,
          BigNumberish,
          BigNumberish
        ],
        craftTime: 0,
        deprecateTime: 1669881600, // 2022-12-01
      },
      {
        name: "LE Golden Tile - Gotchi",
        width: 8,
        height: 8,
        deprecated: false,
        tileType: 0,
        alchemicaCost: [25, 25, 75, 25] as [
          BigNumberish,
          BigNumberish,
          BigNumberish,
          BigNumberish
        ],
        craftTime: 0,
        deprecateTime: 0,
      },
    ];

    const receipt = await (await tileFacet.addTileTypes(tiles)).wait();
    const events = receipt!.events!.filter(
      (event) => event.event === "EditDeprecateTime"
    );
    expect(events.length).to.equal(1);

    const tilesTypes = await tileFacet.getTileTypes([]);
    expect(tilesTypes.length).to.equal(tiles.length + oldTilesTypes.length);
  });

  it("Should revert when craft tile whose deprecation time set", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    await expect(tileFacet.craftTiles([startTileId])).to.be.revertedWith(
      "TileFacet: Tile has been deprecated"
    );
  });
});
