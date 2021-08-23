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

describe("Test ERC1155 GBM", async function () {
  this.timeout(300000);

  let erc1155;
  let erc1155Address;
  let account;

  let diamondAddress;
  let gbmFacet;
  let ownershipFacet;
  let settingsFacet;
  let ghst;
  let auctionId;

  const bidderAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";
  const secondBidderAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  const _pixelcraft = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
  const _playerRewards = "0x27DF5C6dcd360f372e23d5e63645eC0072D0C098";
  const _daoTreasury = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

  const backendPrivKey = process.env.GBM_PK;
  let backendSigner = new ethers.Wallet(backendPrivKey);

  let pcBalance;
  let prBalance;
  let daoBalance;

  const bidAmountTooLow = ethers.utils.parseEther("0.5");
  const bidAmount1 = ethers.utils.parseEther("1");
  console.log("bid 1:", bidAmount1.toString());
  const bidAmount2 = ethers.utils.parseEther("1.1");
  console.log("bid 2:", bidAmount2.toString());

  before(async function () {
    const accounts = await ethers.getSigners();
    account = await accounts[0].getAddress();
  });

  it("Can deploy GBM + GBM Initiator and start an Auction", async function () {
    erc1155Address = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
    erc1155 = await ethers.getContractAt("ERC1155Generic", erc1155Address);

    //Deploy GBM Core
    diamondAddress = await deployDiamond();
    gbmFacet = await ethers.getContractAt("GBMFacet", diamondAddress);
    settingsFacet = await ethers.getContractAt("SettingsFacet", diamondAddress);

    await erc1155.setApprovalForAll(diamondAddress, true);
  });

  it("Transfer NFTs to deployer and start auction", async function () {
    const connectedERC1155 = await impersonate(bidderAddress, erc1155);

    //aave hero mask
    const tokenId = "18";

    let balanceOf = await erc1155.balanceOf(bidderAddress, tokenId);
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

    const connectedGBM = await impersonate(account, gbmFacet);

    await connectedGBM.registerMassERC1155Each(
      diamondAddress,
      true,
      erc1155Address,
      "18",
      "0",
      "2"
    );

    auctionId = (
      await gbmFacet["getAuctionID(address,uint256)"](erc1155Address, "18")
    ).toString();

    await connectedGBM.setBiddingAllowed(erc1155Address, true);

    const auctionInfo = await gbmFacet.getAuctionInfo(auctionId);

    expect(Number(auctionInfo.startTime)).to.greaterThan(0);
  });

  it("Can bid on an auction", async function () {
    //Open bidding
    ethers.provider.send("evm_increaseTime", [3600]);
    ethers.provider.send("evm_mine");

    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    const bidder = await impersonate(bidderAddress, gbmFacet);
    const bidderGhst = await impersonate(bidderAddress, ghst);

    //Bidding

    await bidderGhst.approve(
      diamondAddress,
      ethers.utils.parseEther("10000000")
    );

    const previousBal = await ghst.balanceOf(bidderAddress);

    let messageHash = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [bidderAddress, auctionId, bidAmountTooLow, "0"]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
    let invalidSignature = ethers.utils.arrayify(signedMessage);

    // check both invalid signature and data
    await expect(
      bidder.commitBid(auctionId, bidAmountTooLow, "0", invalidSignature)
    ).to.be.revertedWith("bid: Invalid signature");

    messageHash = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [bidderAddress, auctionId, bidAmount1, "0"]
    );
    signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
    invalidSignature = ethers.utils.arrayify(signedMessage);

    // check invalid signature and valid data
    await expect(
      bidder.commitBid(auctionId, bidAmount1, "0", invalidSignature)
    ).to.be.revertedWith("bid: Invalid signature");

    // place bid with both valid signature and data
    await bidder.commitBid(auctionId, bidAmount1, "0", signature);

    const afterBal = await ghst.balanceOf(bidderAddress);

    expect(afterBal).to.equal(previousBal.sub(bidAmount1));

    //Get highest bid
    const highestBidder = await gbmFacet.getAuctionHighestBidder(auctionId);
    const highestBid = await gbmFacet.getAuctionHighestBid(auctionId);

    expect(highestBidder).to.equal(bidderAddress);
    expect(highestBid).to.equal(bidAmount1);
  });

  it("Can be outbid and address outbid receives incentive", async function () {
    const secondBidder = await impersonate(secondBidderAddress, gbmFacet);
    const secondBidderGhst = await impersonate(secondBidderAddress, ghst);

    //Bidding
    await secondBidderGhst.approve(
      diamondAddress,
      ethers.utils.parseEther("2")
    );
    let previousBid = bidAmount1;

    const previousBal = await ghst.balanceOf(bidderAddress);
    const dueIncentives = await gbmFacet.getAuctionDueIncentives(auctionId);

    let messageHash = ethers.utils.solidityKeccak256(
      ["address", "uint256", "uint256", "uint256"],
      [secondBidderAddress, auctionId, bidAmount2, previousBid]
    );

    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    await secondBidder.commitBid(auctionId, bidAmount2, previousBid, signature);

    const afterBal = await ghst.balanceOf(bidderAddress);

    //New balance is the amount of previous bid + the incentives (calculated before next bid)
    expect(afterBal).to.equal(previousBal.add(previousBid).add(dueIncentives));

    //Check highest bid
    const highestBidder = await gbmFacet.getAuctionHighestBidder(auctionId);
    const highestBid = await gbmFacet.getAuctionHighestBid(auctionId);

    expect(highestBidder).to.equal(secondBidderAddress);
    expect(highestBid).to.equal(bidAmount2);
  });

  it("Can claim NFT prize", async function () {
    ethers.provider.send("evm_increaseTime", [5 * 25 * 3600]);
    ethers.provider.send("evm_mine");

    pcBalance = await ghst.balanceOf(_pixelcraft);
    prBalance = await ghst.balanceOf(_playerRewards);
    daoBalance = await ghst.balanceOf(_daoTreasury);

    //Claim item
    await gbmFacet.claim(auctionId);

    const nftBalance = await erc1155.balanceOf(secondBidderAddress, "18");
    expect(nftBalance).to.equal(1);
  });

  it("Cannot claim twice", async function () {
    // Claim item
    await expect(gbmFacet.claim(auctionId)).to.be.revertedWith(
      "claim: Item has already been claimed"
    );
  });

  it("Various wallet addresses should receive the correct amounts", async function () {
    const auctionInfo = await gbmFacet.getAuctionInfo(auctionId);

    const auctionDebt = auctionInfo.auctionDebt;
    const finalReceiveAmount = bidAmount2.sub(auctionDebt);

    const newPcBalance = await ghst.balanceOf(_pixelcraft);
    const newPrBalance = await ghst.balanceOf(_playerRewards);
    const newDaoBalance = await ghst.balanceOf(_daoTreasury);

    const expectedBurn = finalReceiveAmount.mul(5).div(100);
    const expectedPcIncrease = finalReceiveAmount.mul(40).div(100);
    const expectedPrIncrease = finalReceiveAmount.mul(40).div(100);

    expect(newPcBalance).to.equal(pcBalance.add(expectedPcIncrease));
    expect(newPrBalance).to.equal(prBalance.add(expectedPrIncrease));
    expect(newDaoBalance).to.equal(daoBalance.add(expectedBurn.mul(3)));
  });

  it("Owner can claim unbid NFT", async function () {
    const secondAuctionID = (
      await gbmFacet["getAuctionID(address,uint256,uint256)"](
        erc1155Address,
        "18",
        "1"
      )
    ).toString();

    const accounts = await ethers.getSigners();
    account = await accounts[0].getAddress();
    const ownerGBM = await impersonate(account, gbmFacet);
    //Claim item

    await ownerGBM.claim(secondAuctionID);

    const nftBalance = await erc1155.balanceOf(account, "18");
    expect(nftBalance).to.equal(1);
  });

  it("Only owner can transfer contract", async function () {
    ownershipFacet = await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    );

    const notOwnerGBM = await impersonate(
      "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5",
      ownershipFacet
    );

    await expect(
      notOwnerGBM.transferOwnership(
        "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5"
      )
    ).to.be.revertedWith("Must be contract owner");

    const accounts = await ethers.getSigners();
    account = await accounts[0].getAddress();
    const ownerGBM = await impersonate(account, ownershipFacet);

    await ownerGBM.transferOwnership(
      "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5"
    );

    const owner = await ownerGBM.owner();
    expect(owner).to.equal("0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5");
  });
});
