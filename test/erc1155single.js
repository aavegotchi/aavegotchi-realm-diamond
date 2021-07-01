const { expect } = require("chai");

//@ts-ignore
//import hardhat, { run, ethers } from "hardhat";

async function impersonate(address, contract) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  let signer = await ethers.getSigner(address);
  contract = contract.connect(signer);
  return contract;
}

describe("Test ERC1155 GBM", async function () {
  this.timeout(300000);

  let erc1155;
  let erc1155Address;
  let account;

  let gbm;
  let gbmAddress;
  let gbmInitiatorAddress;
  let ghst;
  let auctionId;

  const bidderAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";
  const secondBidderAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  before(async function () {
    const accounts = await ethers.getSigners();
    account = await accounts[0].getAddress();
  });

  it("Can deploy ERC1155 NFT Contract and mint three NFTs", async function () {
    //Deploy erc1155 Token for Auction
    const ERC1155Factory = await ethers.getContractFactory("ERC1155Generic");
    erc1155 = await ERC1155Factory.deploy();
    erc1155Address = erc1155.address;

    //Mint 10 erc1155s

    await erc1155["mint(uint256,uint256)"]("0", "3");

    const balanceOf = await erc1155.balanceOf(account, "0");
    expect(balanceOf).to.equal(3);
  });

  it("Can deploy GBM + GBM Initiator and start an Auction", async function () {
    //Deploy GBM Core
    const GBMContractFactory = await ethers.getContractFactory("GBM");
    gbm = await GBMContractFactory.deploy(ghstAddress);
    const GBMContractInitiatorFactory = await ethers.getContractFactory(
      "GBMInitiator"
    );
    gbmInitiator = await GBMContractInitiatorFactory.deploy();

    gbmAddress = gbm.address;

    //Initialize settings of Initiator
    await gbmInitiator.setBidDecimals(100000);
    await gbmInitiator.setBidMultiplier(11120);
    await gbmInitiator.setEndTime(Math.floor(Date.now() / 1000) + 86400);
    await gbmInitiator.setHammerTimeDuration(300);
    await gbmInitiator.setIncMax(10000);
    await gbmInitiator.setIncMin(1000);
    await gbmInitiator.setStartTime(Math.floor(Date.now() / 1000));
    await gbmInitiator.setStepMin(10000);

    gbmInitiatorAddress = gbmInitiator.address;

    await erc1155?.setApprovalForAll(gbmAddress, true);

    await gbm.massRegistrerERC1155Each(
      gbmAddress,
      gbmInitiatorAddress,
      erc1155Address,
      "0",
      "0",
      "3"
    );

    auctionId = (
      await gbm["getAuctionID(address,uint256)"](erc1155Address, "0")
    ).toString();

    const auctionStartTime = await gbm.getAuctionStartTime(auctionId);
    expect(Number(auctionStartTime)).to.greaterThan(0);
  });

  it("Can bid on an auction", async function () {
    //Open bidding
    await gbm.setBiddingAllowed(erc1155Address, true);

    //@ts-ignore
    ethers.provider.send("evm_increaseTime", [3600]);

    //@ts-ignore
    ethers.provider.send("evm_mine");

    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    const bidder = await impersonate(bidderAddress, gbm);
    const bidderGhst = await impersonate(bidderAddress, ghst);

    const bidAmount = ethers.utils.parseEther("1");

    //Bidding

    await bidderGhst.approve(gbmAddress, ethers.utils.parseEther("10000000"));

    const previousBal = await ghst.balanceOf(bidderAddress);

    await bidder.bid(auctionId, bidAmount, "0");

    const afterBal = await ghst.balanceOf(bidderAddress);

    expect(afterBal).to.equal(previousBal.sub(bidAmount));

    //Get highest bid
    const highestBidder = await gbm.getAuctionHighestBidder(auctionId);
    const highestBid = await gbm.getAuctionHighestBid(auctionId);

    expect(highestBidder).to.equal(bidderAddress);
    expect(highestBid).to.equal(bidAmount);
  });

  it("Can be outbid and address outbid receives incentive", async function () {
    const secondBidder = await impersonate(secondBidderAddress, gbm);
    const secondBidderGhst = await impersonate(secondBidderAddress, ghst);

    const bidAmount = ethers.utils.parseEther("2");

    //Bidding
    await secondBidderGhst.approve(gbmAddress, ethers.utils.parseEther("2"));
    let previousBid = ethers.utils.parseEther("1");

    const previousBal = await ghst.balanceOf(bidderAddress);
    const dueIncentives = await gbm.getAuctionDueIncentives(auctionId);

    await secondBidder.bid(auctionId, bidAmount, previousBid);

    const afterBal = await ghst.balanceOf(bidderAddress);

    //New balance is the amount of previous bid + the incentives (calculated before next bid)
    expect(afterBal).to.equal(previousBal.add(previousBid).add(dueIncentives));

    //Check highest bid
    const highestBidder = await gbm.getAuctionHighestBidder(auctionId);
    const highestBid = await gbm.getAuctionHighestBid(auctionId);

    expect(highestBidder).to.equal(secondBidderAddress);
    expect(highestBid).to.equal(bidAmount);
  });

  it("Can claim NFT prize", async function () {
    //@ts-ignore
    ethers.provider.send("evm_increaseTime", [25 * 3600]);

    //@ts-ignore
    ethers.provider.send("evm_mine");

    //Claim item
    await gbm.claim(auctionId);

    const nftBalance = await erc1155?.balanceOf(secondBidderAddress, "0");
    expect(nftBalance).to.equal(1);
  });
});
