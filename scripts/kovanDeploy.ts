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
  /*DEPLOY INSTRUCTIONS*/

  //This script is designed to deploy the GBM onto Kovan for use with ERC1155 Wearables. Before deploying, the Wearables should be transferred to the deploying address so they can be transferred easily to the GBM Auction contract.

  //Step 0: Transfer Wearables to deployer address.

  //Step 1: Deploy GBM Auction

  //Step 2: Approve Wearables to be transferred to GBM address.

  //Step 3: Transfer Wearables to GBM contract address

  //Step 4: Start Auction

  //Step 5: ???

  //Step 6: Profit!

  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  console.log("Deploying Account: " + account);
  console.log("---");
  let tx;
  let totalGasUsed = ethers.BigNumber.from("0");
  let receipt;
  let gbm;
  let gbmInitiator;
  let gbmAddress;
  let gbmInitiatorAddress;
  let erc1155;
  let erc1155Address;
  let ghst;
  let ghstAddress;

  const bidderAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";

  let testing = ["hardhat"].includes(hardhat.network.name);
  let kovan = hardhat.network.name === "kovan";

  if (testing) {
    ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc1155 = await ERC721Factory.deploy();
    erc1155Address = erc1155.address;

    //Mint 10 ERC721s

    await erc1155["mint()"]();
    await erc1155["mint()"]();
    await erc1155["mint()"]();
  } else if (kovan) {
    ghstAddress = "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc1155 = await ERC721Factory.deploy();
    erc1155Address = erc1155.address;
  }
  //Set defaults for Matic
  else {
    // erc20Address = ghstAddress
    erc1155Address = "aavegotchiDiamond";
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

  if (erc1155) {
    await erc1155.setApprovalForAll(gbmAddress, true);

    await gbm.massRegistrerERC721Each(
      gbmAddress,
      gbmInitiatorAddress,
      erc1155Address,
      "0",
      "3"
    );
  }

  const auctionId = (
    await gbm["getAuctionID(address,uint256)"](erc1155Address, "0")
  ).toString();

  //Open bidding
  await gbm.setBiddingAllowed(erc1155Address, true);

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

  const nftBalance = await erc1155?.balanceOf(bidderAddress);
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

exports.deploy = main;
