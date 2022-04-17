import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  mineBlocks,
  pixelcraftAddress,
} from "../scripts/helperFunctions";
import {
  TileFacet,
  ERC1155TileFacet,
  IERC20,
  AlchemicaToken,
} from "../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamond } from "../scripts/tile/deploy";
import { BigNumber, Signer } from "ethers";
import {
  maticGhstAddress,
  maticRealmDiamondAddress,
  approveRealAlchemica,
  faucetRealAlchemica,
} from "../scripts/tile/helperFunctions";
import { TileTypeInput } from "../types";

describe("Tiles tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const testAddress2 = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let diamondAddress: string;
  let tileFacet: TileFacet;
  let erc1155TileFacet: ERC1155TileFacet;
  let ghst: IERC20;
  let accounts: Signer[];
  const testParcelId = "141";

  before(async function () {
    this.timeout(20000000);
    diamondAddress = await deployDiamond();
    accounts = await ethers.getSigners();

    tileFacet = (await ethers.getContractAt(
      "TileFacet",
      diamondAddress
    )) as TileFacet;

    erc1155TileFacet = (await ethers.getContractAt(
      "ERC1155TileFacet",
      diamondAddress
    )) as ERC1155TileFacet;

    console.log("diamond address:", diamondAddress);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;
  });

  it("Set Diamond Addresses", async function () {
    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    await tileFacet.setAddresses(
      maticAavegotchiDiamondAddress,
      maticRealmDiamondAddress,
      ethers.constants.AddressZero, //replace
      pixelcraftAddress,
      aavegotchiDAOAddress
    );
  });

  it("Add tile types", async function () {
    let tileTypes = await tileFacet.getTileTypes([]);
    const tiles: TileTypeInput[] = [];
    // const tiles: TileTypeInput[] = [];
    tiles.push({
      width: 1,
      height: 1,
      deprecated: false,
      tileType: 0,
      alchemicaCost: [
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
      ],
      craftTime: 10000,
      name: "0",
    });
    tiles.push({
      width: 2,
      height: 2,
      deprecated: false,
      tileType: 1,
      alchemicaCost: [
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
      ],
      craftTime: 10000,
      name: "1",
    });
    tiles.push({
      width: 4,
      height: 4,
      deprecated: false,
      tileType: 2,
      alchemicaCost: [
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
      ],
      craftTime: 10000,
      name: "2",
    });
    tiles.push({
      width: 6,
      height: 6,
      deprecated: false,
      tileType: 3,
      alchemicaCost: [
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
      ],
      craftTime: 10000,
      name: "3",
    });

    await tileFacet.addTileTypes(tiles);

    tileTypes = await tileFacet.getTileTypes([]);
    expect(tileTypes.length).to.equal(tiles.length);
  });

  it("Craft ID=0 tile with Test Address", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    await faucetRealAlchemica(testAddress, ethers);

    await approveRealAlchemica(testAddress, diamondAddress, ethers);

    await ghst.approve(
      tileFacet.address,
      ethers.utils.parseUnits("1000000000")
    );

    const fud = "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f";

    const fudToken = (await ethers.getContractAt(
      "AlchemicaToken",
      fud
    )) as AlchemicaToken;
    let fudBalanceBefore = await fudToken.balanceOf(testAddress);

    const pixelcraftFudBalancePre = await fudToken.balanceOf(pixelcraftAddress);
    const daoBalancePre = await fudToken.balanceOf(aavegotchiDAOAddress);

    await tileFacet.craftTiles([0, 0, 0, 0, 0]);
    await expect(tileFacet.claimTiles([0])).to.be.revertedWith(
      "TileFacet: tile not ready"
    );

    let fudBalanceAfter = await fudToken.balanceOf(testAddress);
    //five tiles were crafted, each 100
    expect(fudBalanceAfter).to.equal(
      fudBalanceBefore.sub(ethers.utils.parseEther("500"))
    );

    //30% of 500 is 150 for Pixelcraft
    const pixelcraftFudBalance = await fudToken.balanceOf(pixelcraftAddress);
    expect(pixelcraftFudBalance.sub(pixelcraftFudBalancePre)).to.equal(
      ethers.utils.parseEther("150")
    );

    //30% of 500 is 150 for DAO
    const daoBalance = await fudToken.balanceOf(aavegotchiDAOAddress);
    expect(daoBalance.sub(daoBalancePre)).to.equal(
      ethers.utils.parseEther("150")
    );

    await mineBlocks(ethers, 11000);

    //Claimed five tiles
    await tileFacet.claimTiles([0, 1, 2, 3, 4]);
    const balancePost = await erc1155TileFacet.balanceOf(testAddress, 0);
    expect(balancePost).to.eq(5);
  });
  it("Transfer ID=0 tile from Test address to Test Address 2", async function () {
    erc1155TileFacet = await impersonate(
      testAddress,
      erc1155TileFacet,
      ethers,
      network
    );

    const balancePre = await erc1155TileFacet.balanceOf(testAddress, 0);
    const balancePre2 = await erc1155TileFacet.balanceOf(testAddress2, 0);
    expect(balancePre).to.gt(balancePre2);

    await erc1155TileFacet.safeTransferFrom(
      testAddress,
      testAddress2,
      0,
      3,
      []
    );
    const balancePost = await erc1155TileFacet.balanceOf(testAddress, 0);
    const balancePost2 = await erc1155TileFacet.balanceOf(testAddress2, 0);
    expect(balancePost2).to.gt(balancePost);
  });
  it("Batch transfer ID=1 tiles from test address to test address 2", async function () {
    this.timeout(20000000);
    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);
    erc1155TileFacet = await impersonate(
      testAddress,
      erc1155TileFacet,
      ethers,
      network
    );
    await tileFacet.craftTiles([1, 1, 1, 1]);

    await mineBlocks(ethers, 51000);

    await tileFacet.claimTiles([5, 6, 7, 8]);
    const balancePreHarv = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress, 0),
      0
    );
    const balancePreHarv2 = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress2, 0),
      0
    );
    const balancePreRes = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress, 1),
      0
    );
    const balancePreRes2 = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress2, 1),
      0
    );
    await erc1155TileFacet.safeBatchTransferFrom(
      testAddress,
      testAddress2,
      [0, 1],
      [2, 3],
      []
    );
    const balancePostHarv = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress, 0),
      0
    );
    const balancePostHarv2 = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress2, 0),
      0
    );
    const balancePostRes = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress, 1),
      0
    );
    const balancePostRes2 = ethers.utils.formatUnits(
      await erc1155TileFacet.balanceOf(testAddress2, 1),
      0
    );
    expect(Number(balancePreHarv) + Number(balancePreHarv2)).to.equal(
      Number(balancePostHarv) + Number(balancePostHarv2)
    );
    expect(Number(balancePreRes) + Number(balancePreRes2)).to.equal(
      Number(balancePostRes) + Number(balancePostRes2)
    );
  });

  it("Only owner can deprecate tile", async function () {
    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);
    await expect(tileFacet.deprecateTiles(["1"])).to.be.revertedWith(
      "LibDiamond: Must be contract owner"
    );

    tileFacet = await impersonate(
      await accounts[0].getAddress(),
      tileFacet,
      ethers,
      network
    );

    await tileFacet.deprecateTiles(["1"]);

    tileFacet = await impersonate(
      await accounts[0].getAddress(),
      tileFacet,
      ethers,
      network
    );

    await expect(tileFacet.craftTiles(["1"])).to.be.revertedWith(
      "TileFacet: Tile has been deprecated"
    );
  });
});
