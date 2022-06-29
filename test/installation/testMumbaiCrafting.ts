import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { TileFacet } from "../../typechain";
import { upgradeMumbaiCraft } from "../../scripts/tile/upgrades/upgrade-mumbaiCraft";

describe("Testing Crafting ", async function () {
  const testAddress = "0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce";

  const tileAddress = "0xDd8947D7F6705136e5A12971231D134E80DFC15d";

  let tileFacet: TileFacet;

  before(async function () {
    this.timeout(20000000);

    tileFacet = (await ethers.getContractAt(
      "TileFacet",
      tileAddress,
      await ethers.getSigners()[0]
    )) as TileFacet;

    await upgradeMumbaiCraft();
  });

  it("Craft tiles", async function () {
    //  tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    console.log("Crafting");

    await tileFacet.craftTiles([1]);
  });
});
