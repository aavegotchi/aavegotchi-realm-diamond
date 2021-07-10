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
  let signer;
  let deployerAddress;

  const bidderAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";
  const secondBidderAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  before(async function () {
    const accounts = await ethers.getSigners();
    account = await accounts[0].getAddress();
    console.log("account:", account);
  });

  it("Can deploy GBM + GBM Initiator and start an Auction", async function () {
    erc1155Address = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";

    erc1155 = await ethers.getContractAt("ERC1155Generic", erc1155Address);

    //Deploy GBM Core

    const GBMContractFactory = await ethers.getContractFactory("GBM");
    gbm = await GBMContractFactory.deploy(ghstAddress);
    const GBMContractInitiatorFactory = await ethers.getContractFactory(
      "GBMInitiator"
    );

    let startTime = Math.floor(Date.now() / 1000);
    let endTime = Math.floor(Date.now() / 1000) + 86400;
    let hammerTimeDuration = 300;
    let bidDecimals = 100000;
    let stepMin = 10000;
    let incMax = 10000;
    let incMin = 1000;
    let bidMultiplier = 11120;

    gbmInitiator = await GBMContractInitiatorFactory.deploy(
      startTime,
      endTime,
      hammerTimeDuration,
      bidDecimals,
      stepMin,
      incMin,
      incMax,
      bidMultiplier
    );
    gbmAddress = gbm.address;

    const owner = await gbmInitiator.getOwner();
    console.log("owner:", owner);

    gbmInitiatorAddress = gbmInitiator.address;

    await erc1155.setApprovalForAll(gbmAddress, true);
  });

  it("Transfer NFTs to deployer and start auction", async function () {
    const connectedERC1155 = await impersonate(bidderAddress, erc1155);

    //aave hero mask
    const tokenId = "18";

    let balanceOf = await erc1155.balanceOf(bidderAddress, tokenId);
    console.log("balance of:", balanceOf.toString());
    expect(balanceOf).to.equal(2);

    await connectedERC1155.safeTransferFrom(
      bidderAddress,
      account,
      tokenId,
      "2",
      []
    );

    balanceOf = await erc1155.balanceOf(account, tokenId);
    expect(balanceOf).to.equal(2);

    console.log("balance is:", balanceOf.toString());

    const connectedGBM = await impersonate(account, gbm);

    await connectedGBM.massRegistrerERC1155Each(
      gbmAddress,
      gbmInitiatorAddress,
      erc1155Address,
      "18",
      "0",
      "2"
    );

    /*
    await connectedGBM.registerAnAuctionToken(
      erc1155Address,
      "18",
      "0x973bb640",
      gbmInitiatorAddress
    );
    */

    auctionId = (
      await gbm["getAuctionID(address,uint256)"](erc1155Address, "18")
    ).toString();

    console.log("auction id:", auctionId);

    await connectedGBM.setBiddingAllowed(erc1155Address, true);

    const auctionStartTime = await gbm.getAuctionStartTime(auctionId);

    console.log("start time:", auctionStartTime);
    expect(Number(auctionStartTime)).to.greaterThan(0);
  });

  it("Can bid on an auction", async function () {
    //Open bidding

    //@ts-ignore
    ethers.provider.send("evm_increaseTime", [3600]);

    //@ts-ignore
    ethers.provider.send("evm_mine");

    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    const bidder = await impersonate(bidderAddress, gbm);
    const bidderGhst = await impersonate(bidderAddress, ghst);

    const bidAmount = ethers.utils.parseEther("0.1");

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

    const bidAmount = ethers.utils.parseEther("0.2");

    //Bidding
    await secondBidderGhst.approve(gbmAddress, ethers.utils.parseEther("2"));
    let previousBid = ethers.utils.parseEther("0.1");

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

    const nftBalance = await erc1155.balanceOf(secondBidderAddress, "18");
    expect(nftBalance).to.equal(1);
  });

  it("Cannot claim twice", async function () {
    //Claim item
    await expect(gbm.claim(auctionId)).to.be.revertedWith(
      "claim: Item has already been claimed"
    );
  });
});
