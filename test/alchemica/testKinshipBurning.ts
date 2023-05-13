import { maticRealmDiamondAddress } from "../../scripts/tile/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { AlchemicaFacet } from "../../typechain-types";

import {
  impersonate,
  maticAavegotchiDiamondAddress,
} from "../../scripts/helperFunctions";

import { AavegotchiDiamond, TestAlchemicaFacet } from "../../typechain-types";
import { BigNumber, ContractReceipt } from "ethers";
import { upgradeRealmTest } from "../../scripts/alchemica/test/upgrade-testAlchemica";
import { upgradeBurnKinship } from "../../scripts/alchemica/upgrades/upgrade-burnKinship";
import { log } from "console";

describe("Testing kinship Burning ", async function () {
  //lending channeling
  const lentGotchiId = "3410";
  const parcelId = "21688";

  //direct channeling
  const gotchiId2 = "19725";
  const parcelId2 = "10554";

  let testAlchemicaFacet: TestAlchemicaFacet;
  let aFacet: AavegotchiDiamond;
  let alchemicaFacet: AlchemicaFacet;

  before(async function () {
    this.timeout(20000000);

    await upgradeRealmTest();
    await upgradeBurnKinship();

    aFacet = (await ethers.getContractAt(
      "AavegotchiDiamond",
      maticAavegotchiDiamondAddress
    )) as AavegotchiDiamond;

    testAlchemicaFacet = (await ethers.getContractAt(
      "TestAlchemicaFacet",
      maticRealmDiamondAddress
    )) as TestAlchemicaFacet;

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      maticRealmDiamondAddress
    )) as AlchemicaFacet;
  });

  //This test assumes that the upgrade has been executed on the aaavegotchiDiamond

  //   it("Test kinship burning through normal channeling", async function () {
  //     const owner2 = await aFacet.ownerOf(gotchiId2);

  //     testAlchemicaFacet = await impersonate(
  //       owner2,
  //       testAlchemicaFacet,
  //       ethers,
  //       network
  //     );
  //     //get kinship before
  //     const kinshipBefore = await aFacet.kinship(gotchiId2);
  //     const lastChanneled = await alchemicaFacet.getLastChanneled(gotchiId2);

  //     log("kinship before: ", kinshipBefore.toString());
  //     log("lastChanneled before: ", lastChanneled.toString());
  //     //channel

  //     await testAlchemicaFacet.mockChannelAlchemica(
  //       parcelId2,
  //       gotchiId2,
  //       lastChanneled
  //     );

  //     expect(await aFacet.kinship(gotchiId2)).to.equal(kinshipBefore.sub(2));
  //   });

  it("Cannot channel with lent gotchi if channeling is not enabled", async function () {
    const owner = await aFacet.ownerOf(lentGotchiId);
    const lastChanneled = await alchemicaFacet.getLastChanneled(lentGotchiId);

    testAlchemicaFacet = await impersonate(
      owner,
      testAlchemicaFacet,
      ethers,
      network
    );

    await expect(
      testAlchemicaFacet.mockChannelAlchemica(
        parcelId,
        lentGotchiId,
        lastChanneled
      )
    ).to.be.revertedWith("Channeling not enabled by listing owner");
  });

  it("Can channel with lent gotchi if channeling is enabled", async function () {
    //get the listing id
    let listingInfo = await aFacet.getGotchiLendingFromToken(lentGotchiId);

    //cancel listing

    const listingOwner = listingInfo.lender;
    aFacet = await impersonate(listingOwner, aFacet, ethers, network);

    await aFacet.claimAndEndGotchiLending(lentGotchiId);

    //create a new listing with channeling enabled
    const tx = await aFacet[
      "addGotchiLending(uint32,uint96,uint32,uint8[3],address,address,uint32,address[],uint256)"
    ](
      listingInfo.erc721TokenId,
      listingInfo.initialCost,
      listingInfo.period,
      listingInfo.revenueSplit,
      listingInfo.originalOwner,
      listingInfo.thirdParty,
      0,
      listingInfo.revenueTokens,
      1
    );
    const newListingId = getNewListingId(await tx.wait());
    log("new listing id: ", newListingId.toString());
    //assert that channelling status has changed
    listingInfo = await aFacet.getGotchiLendingFromToken(lentGotchiId);

    expect(listingInfo.channellingStatus).to.equal(1);

    //accept listing
    aFacet = await impersonate(listingInfo.borrower, aFacet, ethers, network);
    await aFacet.agreeGotchiLending(
      newListingId,
      listingInfo.erc721TokenId,
      listingInfo.initialCost,
      listingInfo.period,
      listingInfo.revenueSplit
    );

    //channeling should reduce kinship by 2
    const kinshipBefore = await aFacet.kinship(lentGotchiId);

    const lastChanneled = await alchemicaFacet.getLastChanneled(lentGotchiId);

    testAlchemicaFacet = await impersonate(
      listingInfo.borrower,
      testAlchemicaFacet,
      ethers,
      network
    );

    await testAlchemicaFacet.mockChannelAlchemica(
      parcelId,
      lentGotchiId,
      lastChanneled
    );

    expect(await aFacet.kinship(lentGotchiId)).to.equal(kinshipBefore.sub(2));
  });
});

interface LogEvent {
  topics: string[];
  data: string;
}

interface IGotchiLending {
  listingId: string;
  lender: string;
  tokenId: BigNumber;
  initialCost: BigNumber;
  period: number;
  revenueSplit: [BigNumber, BigNumber, BigNumber];
  originalOwner: string;
  thirdParty: string;
  whitelistId: BigNumber;
  revenueTokens: string[];
  timeCancelled?: BigNumber;
  timeEnded?: BigNumber;
  timeClaimed?: BigNumber;
  timeAgreed?: BigNumber;
  timeCreated?: BigNumber;
  borrower?: string;
  channellingStatus: BigNumber;
}

function parse(e: LogEvent, abi: string[]) {
  let iface = new ethers.utils.Interface(abi);

  return iface.parseLog(e).args;
}

const gAdd = [
  `event GotchiLendingAdded((uint32 listingId,address lender,uint32 tokenId,uint96 initialCost,uint32 period,uint8[3] revenueSplit,address originalOwner,address thirdParty,uint32 whitelistId,address[] revenueTokens,uint256 timeCreated,uint256 channellingStatus))`,
];

function getNewListingId(receipt: ContractReceipt) {
  let pItems: IGotchiLending[] = [];
  const data = receipt.events![receipt.events!.length - 1];

  const ev = {
    topics: data.topics,
    data: data.data,
  };
  pItems = parse(ev, gAdd) as IGotchiLending[];
  return pItems[0].listingId;
}
