import { impersonate } from "../../scripts/helperFunctions";
import { ERC721Facet } from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";

import { upgrade } from "../../scripts/realm/upgrades/upgrade-transferIndexFix";
import { buggedParcel } from "../../scripts/realm/upgrades/upgrade-transferIndexFix";
import { maticRealmDiamondAddress } from "../../scripts/tile/helperFunctions";

describe("Testing Equip Installation", async function () {
  let erc721Facet: ERC721Facet;

  let buggedParcelOwner;
  const randAddress = "0x5bA010b5E6Dbc96836Fb13Db450f5574681eB2d0";
  const randAddress2 = "0x5f2B6648A7B62beA1B4bC31eDC318365FA7BB0FF";
  let currentOwner;
  before(async function () {
    this.timeout(20000000);

    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      maticRealmDiamondAddress
    )) as ERC721Facet;
    await upgrade();
  });
  it("Should be able to transfer parcel normally after fix ", async function () {
    buggedParcelOwner = await erc721Facet.ownerOf(buggedParcel);
    erc721Facet = await impersonate(
      buggedParcelOwner,
      erc721Facet,
      ethers,
      network
    );
    //works fine now
    await erc721Facet["safeTransferFrom(address,address,uint256)"](
      buggedParcelOwner,
      randAddress,
      buggedParcel
    );

    currentOwner = await erc721Facet.ownerOf(buggedParcel);
    expect(currentOwner).to.equal(randAddress);
  });
  it("Transferring to self should not bug a parcel", async () => {
    erc721Facet = await impersonate(randAddress, erc721Facet, ethers, network);
    //transfer to self
    await erc721Facet["safeTransferFrom(address,address,uint256)"](
      randAddress,
      randAddress,
      buggedParcel
    );

    //confirm ownership doesn't change
    currentOwner = await erc721Facet.ownerOf(buggedParcel);
    expect(currentOwner).to.equal(randAddress);

    //make sure subsequent transfers work

    //transfer to another address
    await erc721Facet["safeTransferFrom(address,address,uint256)"](
      randAddress,
      randAddress2,
      buggedParcel
    );

    //confirm ownership changes
    currentOwner = await erc721Facet.ownerOf(buggedParcel);
    expect(currentOwner).to.equal(randAddress2);
  });
});
