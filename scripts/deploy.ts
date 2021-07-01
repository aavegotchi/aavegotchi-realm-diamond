//@ts-ignore
import hardhat, { run, ethers } from "hardhat";

async function impersonate(address: string, contract: any) {
  await hardhat.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  let signer = await ethers.getSigner(address);
  contract = contract.connect(signer);
  return contract;
}

async function main() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  console.log("Account: " + account);
  console.log("---");
  let tx;
  let totalGasUsed = ethers.BigNumber.from("0");
  let receipt;
  let gbm;
  let gbmInitiator;
  let gbmAddress;
  let gbmInitiatorAddress;
  let erc721;
  let erc721Address;
  let ghst;
  //let massRegistrer;

  const bidderAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";

  let testing = ["hardhat", "kovan"].includes(hardhat.network.name);

  if (testing) {
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    const ghstBalance = await ghst.balanceOf(bidderAddress);
    console.log("ghst balance:", ghstBalance.toString());

    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc721 = await ERC721Factory.deploy();
    erc721Address = erc721.address;

    //Mint 10 ERC721s

    await erc721["mint()"]();
    await erc721["mint()"]();
    await erc721["mint()"]();
  }
  //Set defaults for Matic
  else {
    // erc20Address = ghstAddress
    erc721Address = "aavegotchiDiamond";
  }

  //Deploy GBM Core
  const GBMContractFactory = await ethers.getContractFactory("GBM");
  gbm = await GBMContractFactory.deploy(ghstAddress);
  const GBMContractInitiatorFactory = await ethers.getContractFactory(
    "GBMInitiator"
  );
  gbmInitiator = await GBMContractInitiatorFactory.deploy();

  gbmAddress = gbm.address;
  console.log("gbm deployed:", gbmAddress);

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

  //Register the Auction

  if (erc721) {
    const totalSupply = await erc721.getTotalSupply();
    console.log("total supply:", totalSupply.toString());

    const owner = await erc721.ownerOf("0");

    await erc721.setApprovalForAll(gbmAddress, true);

    await gbm.massRegistrerERC721Each(
      gbmAddress,
      gbmInitiatorAddress,
      erc721Address,
      "0",
      "3"
    );
  }

  const auctionId = (
    await gbm["getAuctionID(address,uint256)"](erc721Address, "0")
  ).toString();

  //Open bidding
  await gbm.setBiddingAllowed(erc721Address, true);

  //@ts-ignore
  ethers.provider.send("evm_increaseTime", [3600]);

  //@ts-ignore
  ethers.provider.send("evm_mine");

  const bidder = await impersonate(bidderAddress, gbm);
  const bidderGhst = await impersonate(bidderAddress, ghst);

  const bidAmount = ethers.utils.parseEther("1");

  //Bidding

  await bidderGhst.approve(gbmAddress, ethers.utils.parseEther("10000000"));
  await bidder.bid(auctionId, bidAmount, "0");

  //Get highest bid
  const highestBidder = await gbm.getAuctionHighestBidder(auctionId);
  const highestBid = await gbm.getAuctionHighestBid(auctionId);

  console.log("highest bid:", highestBidder, highestBid.toString());

  //@ts-ignore
  ethers.provider.send("evm_increaseTime", [25 * 3600]);

  //@ts-ignore
  ethers.provider.send("evm_mine");

  //Claim item
  await gbm.claim(auctionId);

  const nftBalance = await erc721?.balanceOf(bidderAddress);
  console.log("nft balance:", nftBalance);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

//exports.deployProject = main;

// diamond address: 0x7560d1282A3316DE155452Af3ec248d05b8A8044
