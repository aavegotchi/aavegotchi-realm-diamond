import hardhat, { run, ethers } from "hardhat";

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
  let erc20;
  let erc20Address;
  let erc721;
  let erc721Address;
  let massRegistrer;

  let testing = ["hardhat", "kovan"].includes(hardhat.network.name);

  if (testing) {
    //Deploy ERC20 Token for Payment
    const ERC20Factory = await ethers.getContractFactory("ERC20Generic");
    erc20 = await ERC20Factory.deploy();
    erc20Address = erc20.address;
    erc20.mint(ethers.utils.parseEther("100"));
    console.log("erc20 address:", erc20Address);

    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc721 = await ERC721Factory.deploy();
    erc721Address = erc721.address;

    //Mint 10 ERC721s
    for (let index = 0; index < 10; index++) {
      erc721["mint()"];
    }

    console.log("erc721 address:", erc721Address);
  }
  //Set defaults for Matic
  else {
    erc20Address = "ghstAddress";
    erc721Address = "aavegotchiDiamond";
  }

  //Deploy GBM Core
  const GBMContractFactory = await ethers.getContractFactory("GBM");
  gbm = await GBMContractFactory.deploy(erc20Address);
  const GBMContractInitiatorFactory = await ethers.getContractFactory(
    "GBMInitiator"
  );
  gbmInitiator = await GBMContractInitiatorFactory.deploy();

  gbmAddress = gbm.address;
  console.log("gbm deployed:", gbmAddress);

  //Initialize settings of Initiator
  await gbmInitiator.setBidDecimals(100000);
  await gbmInitiator.setBidMultiplier(11120);
  // await gbmInitiator.setEndTime("in 25mn");
  await gbmInitiator.setHammerTimeDuration(300);
  await gbmInitiator.setIncMax(10000);
  await gbmInitiator.setIncMin(1000);
  // await gbmInitiator.setStartTime("in 15mn");
  await gbmInitiator.setStepMin(10000);

  gbmInitiatorAddress = gbmInitiator.address;

  console.log("gbm initiator deployed:", gbmInitiatorAddress);

  //Register Parameters on GBM
  await gbm.registerAnAuctionContract(erc721Address, gbmInitiatorAddress);

  //Deploy helper contracts
  const MassRegistrerFactory = await ethers.getContractFactory("MassRegistrer");
  massRegistrer = await MassRegistrerFactory.deploy();
  // erc721Address = erc721.address;
  console.log("registrer address:", massRegistrer.address);

  //Register the Auction

  /*
  await massRegistrer.massRegistrerERC721Default(
    gbmAddress,
    gbmInitiatorAddress,
    erc721Address,
    "0",
    "9"
  );
  */

  await gbm.registerAnAuctionToken(
    erc721Address,
    "0",
    "0x73ad2146",
    gbmInitiatorAddress
  );

  const tokenId = await gbm.getTokenId("0");

  console.log("token id:", tokenId);

  /*
  if (hre.network.name === "hardhat") {
  } else if (hre.network.name === "matic") {
  } else if (hre.network.name === "kovan") {
  } else {
    throw Error("No network settings for " + hre.network.name);
  }
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

//exports.deployProject = main;

// diamond address: 0x7560d1282A3316DE155452Af3ec248d05b8A8044
