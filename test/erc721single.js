const { deployDiamond } = require("../scripts/deploy");
const { expect } = require("chai");

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

describe("Test ERC721 GBM", async function () {
  this.timeout(300000);

  let erc721;
  let erc721Address;
  let account;

  let diamondAddress;
  let gbmFacet, settingsFacet;
  let ghst;
  let auctionId;

  const bidderAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";
  const secondBidderAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  const backendPrivKey = process.env.GBM_PK;
  let backendSigner = new ethers.Wallet(backendPrivKey);

  before(async function () {
    const accounts = await ethers.getSigners();
    account = await accounts[0].getAddress();
  });

  it("Can deploy ERC721 NFT Contract and mint three NFTs", async function () {
    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc721 = await ERC721Factory.deploy();
    erc721Address = erc721.address;

    //Mint 10 ERC721s

    await erc721["mint()"]();
    await erc721["mint()"]();
    await erc721["mint()"]();

    const balanceOf = await erc721.balanceOf(account);
    expect(balanceOf).to.equal(3);
  });

  it("Can deploy GBM + GBM Initiator and start an Auction", async function () {
    diamondAddress = await deployDiamond();
    gbmFacet = await ethers.getContractAt("GBMFacet", diamondAddress);
    settingsFacet = await ethers.getContractAt("SettingsFacet", diamondAddress);

    await erc721?.setApprovalForAll(diamondAddress, true);

    await settingsFacet.setBackendPubKey(
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
    );

    await gbmFacet.registerMassERC721Each(
      diamondAddress,
      true,
      erc721Address,
      "0",
      "3"
    );

    auctionId = (
      await gbmFacet["getAuctionID(address,uint256)"](erc721Address, "0")
    ).toString();

    const auctionStartTime = await gbmFacet.getAuctionStartTime(auctionId);
    expect(Number(auctionStartTime)).to.greaterThan(0);
  });

  it("Can bid on an auction", async function () {
    //Open bidding
    await gbmFacet.setBiddingAllowed(erc721Address, true);

    ethers.provider.send("evm_increaseTime", [3600]);
    ethers.provider.send("evm_mine");

    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    const bidder = await impersonate(bidderAddress, gbmFacet);
    const bidderGhst = await impersonate(bidderAddress, ghst);

    const bidAmount = ethers.utils.parseEther("1");

    //Bidding

    await bidderGhst.approve(
      diamondAddress,
      ethers.utils.parseEther("10000000")
    );

    const previousBal = await ghst.balanceOf(bidderAddress);

    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256"],
      [auctionId, bidAmount, "0"]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
    let invalidSignature = ethers.utils.arrayify(signedMessage);

    // check invalid signature
    await expect(
      bidder.placeBid(auctionId, bidAmount, "0", invalidSignature)
    ).to.be.revertedWith("bid: Invalid signature");

    // place bid with valid signature
    await bidder.placeBid(auctionId, bidAmount, "0", signature);

    const afterBal = await ghst.balanceOf(bidderAddress);

    expect(afterBal).to.equal(previousBal.sub(bidAmount));

    //Get highest bid
    const highestBidder = await gbmFacet.getAuctionHighestBidder(auctionId);
    const highestBid = await gbmFacet.getAuctionHighestBid(auctionId);

    expect(highestBidder).to.equal(bidderAddress);
    expect(highestBid).to.equal(bidAmount);
  });

  it("Can be outbid and address outbid receives incentive", async function () {
    const secondBidder = await impersonate(secondBidderAddress, gbmFacet);
    const secondBidderGhst = await impersonate(secondBidderAddress, ghst);

    const bidAmount = ethers.utils.parseEther("2");

    //Bidding
    await secondBidderGhst.approve(
      diamondAddress,
      ethers.utils.parseEther("2")
    );
    let previousBid = ethers.utils.parseEther("1");

    const previousBal = await ghst.balanceOf(bidderAddress);
    const dueIncentives = await gbmFacet.getAuctionDueIncentives(auctionId);

    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256"],
      [auctionId, bidAmount, previousBid]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    await secondBidder.placeBid(auctionId, bidAmount, previousBid, signature);

    const afterBal = await ghst.balanceOf(bidderAddress);

    //New balance is the amount of previous bid + the incentives (calculated before next bid)
    expect(afterBal).to.equal(previousBal.add(previousBid).add(dueIncentives));

    //Check highest bid
    const highestBidder = await gbmFacet.getAuctionHighestBidder(auctionId);
    const highestBid = await gbmFacet.getAuctionHighestBid(auctionId);

    expect(highestBidder).to.equal(secondBidderAddress);
    expect(highestBid).to.equal(bidAmount);
  });

  it("Can claim NFT prize", async function () {
    ethers.provider.send("evm_increaseTime", [25 * 3600]);
    ethers.provider.send("evm_mine");

    //Claim item
    await gbmFacet.claim(auctionId);

    const nftBalance = await erc721?.balanceOf(secondBidderAddress);
    expect(nftBalance).to.equal(1);
  });
});
