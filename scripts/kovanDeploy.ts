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
    erc1155Address = "0x07543dB60F19b9B48A69a7435B5648b46d4Bb58E";
  }
  //Set defaults for Matic
  else {
    erc1155Address = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  }

  //Deploy GBM Core

  const _pixelcraft = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
  const _playerRewards = "0x27DF5C6dcd360f372e23d5e63645eC0072D0C098";
  const _daoTreasury = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

  let startTime = Math.floor(Date.now() / 1000);
  let endTime = Math.floor(Date.now() / 1000) + 86400;
  let hammerTimeDuration = 300;
  let bidDecimals = 100000;
  let stepMin = 10000;
  let incMax = 10000;
  let incMin = 1000;
  let bidMultiplier = 11120;

  const GBMContractFactory = await ethers.getContractFactory("GBM");
  gbm = await GBMContractFactory.deploy(
    ghstAddress,
    _pixelcraft,
    _playerRewards,
    _daoTreasury
  );
  const GBMContractInitiatorFactory = await ethers.getContractFactory(
    "GBMInitiator"
  );
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
  console.log("gbm deployed:", gbmAddress);

  gbmInitiatorAddress = gbmInitiator.address;

  //Register the Auction

  console.log("GBM Deployed to:", gbmAddress);
  console.log("Initiator deployed to:", gbmInitiatorAddress);

  /*

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
  */
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
