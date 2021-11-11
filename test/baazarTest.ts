import {
  impersonate,
  maticDiamondAddress,
  maticAavegotchiDiamondAddress,
} from "../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { RealmFacet, ERC721Facet, ERC721Marketplace } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-baazaarSupport";

describe("Testing Realms in baazaar", async function () {
  const testAddress = "0xBC67F26c2b87e16e304218459D2BB60Dac5C80bC";
  const gbmAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";
  const listingPrice = ethers.utils.parseUnits("100"); // 100 GHST
  const realmId = 6453;
  let accounts;
  let ownerAddress;
  let realmFacet: RealmFacet;
  let erc721Facet: ERC721Facet;
  let erc721Marketplace: ERC721Marketplace;

  before(async function () {
    this.timeout(20000000);
    await upgrade();
    accounts = await ethers.getSigners();
    ownerAddress = accounts[0].address;

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;
    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      maticDiamondAddress
    )) as ERC721Facet;
    erc721Marketplace = (await ethers.getContractAt(
      "ERC721Marketplace",
      maticAavegotchiDiamondAddress
    )) as ERC721Marketplace;
  });
  it("Create new listing", async function () {
    let o = await erc721Facet.ownerOf(realmId);
    console.log(o);
    erc721Facet = await impersonate(gbmAddress, erc721Facet, ethers, network);
    await erc721Facet["safeTransferFrom(address,address,uint256)"](
      gbmAddress,
      testAddress,
      6453
    );
    o = await erc721Facet.ownerOf(realmId);
    console.log(o);
    erc721Facet = await impersonate(testAddress, erc721Facet, ethers, network);
    await erc721Facet.setApprovalForAll(maticAavegotchiDiamondAddress, true);
    erc721Marketplace = await impersonate(
      testAddress,
      erc721Marketplace,
      ethers,
      network
    );
    await erc721Marketplace.addERC721Listing(
      maticDiamondAddress,
      realmId,
      listingPrice
    );
  });
  xit("Purchase new listing", async function () {});
  xit("Listing cancelled when Realm is transferred", async function () {});
});
