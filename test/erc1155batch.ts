//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
// @ts-ignore
import moment from "moment";
// @ts-ignore
import chalk from "chalk";
import { createLogger, format, transports } from "winston";
import auctionConfig from "../auction.config";

const startAt = moment().format("YYYY-MM-DD_HH-mm-ss");
const file = new transports.File({
  filename: `logs/${hardhat.network.name}/${auctionConfig.id}/erc${auctionConfig.ercType}/${startAt}.log.json`,
});
const logger = createLogger({
  level: "info",
  format: format.json(),
  defaultMeta: { service: auctionConfig.id },
  transports: [file],
});

async function impersonate(address: string, contract: any) {
  await hardhat.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  let signer = await ethers.getSigner(address);
  contract = contract.connect(signer);
  return contract;
}

logger.on("finish", () => {
  // All `info` log messages has now been logged
  process.exit(0);
});

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
  let gbmAddress: string;
  let gbmInitiatorAddress: string;
  let erc1155;
  let erc1155Address: string;
  let ghst;
  let ghstAddress;

  const bidderAddress = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";

  let testing = ["hardhat"].includes(hardhat.network.name);
  let kovan = hardhat.network.name === "kovan";

  if (testing) {
    ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);
    //Deploy ERC721 Token for Auction
    // const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    // erc1155Address = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
    const factory = await ethers.getContractFactory("ERC1155Generic");
    erc1155 = await factory.deploy();
    erc1155Address = erc1155.address;
    // erc1155 = await ERC721Factory.deploy();
    // erc1155Address = erc1155.address;
    // //Mint 2000 ERC721s
    // for (let i = 0; i < auctionConfig.auctionCount; i++) {
    //   await erc1155["mint()"]();
    // }

    const connectedERC1155 = await impersonate(bidderAddress, erc1155);

    //aave hero mask
    const tokenId = "18";

    let balanceOf = await erc1155.balanceOf(account, tokenId);
    console.log("balance of:", balanceOf.toString());
    // expect(balanceOf).to.equal(2);

    await connectedERC1155.safeTransferFrom(
      bidderAddress,
      account,
      tokenId,
      "2",
      []
    );

    balanceOf = await erc1155.balanceOf(account, tokenId);
    // expect(balanceOf).to.equal(2);

    console.log("balance is:", balanceOf.toString());
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
  console.log("GBM deployed to:", gbmAddress);
  gbmInitiatorAddress = gbmInitiator.address;
  console.log("GBMInitiator deployed to:", gbmInitiatorAddress);

  const connectedGBM = await impersonate(account, gbm);

  await connectedGBM.massRegistrerERC1155Each(
    gbmAddress,
    gbmInitiatorAddress,
    erc1155Address,
    "18",
    "0",
    "2"
  );

  console.log(
    `[${chalk.cyan(hardhat.network.name)} ${chalk.yellow(
      auctionConfig.id
    )}] Create auctions. AMOUNT: ${chalk.yellow(
      auctionConfig.auctionCount
    )}. TYPE: ${chalk.yellow(
      "ERC" + auctionConfig.ercType
    )}. START_AT: ${chalk.yellow(auctionConfig.initialIndex)}`
  );
  if (auctionConfig.ercType == 721) {
    if (auctionConfig.tokenId != 0)
      throw new Error("ERC721 tokenId should be zero, check your config.");
    console.log(
      `Type ERC 721, starts at index ${auctionConfig.initialIndex}, amount of ${
        auctionConfig.auctionCount
      }, /25 R = ${auctionConfig.auctionCount % 25}`
    );
  } else if (auctionConfig.ercType == 1155) {
    console.log(`Type ERC 1155, starts at index ${auctionConfig.initialIndex}`);
  }

  //Register the Auctions
  let maxAuctions = auctionConfig.auctionCount;
  let auctionSteps = 30; // amount of items in a batch call
  let txNeeded = maxAuctions / auctionSteps;
  let remainder = maxAuctions % auctionSteps; // ie 502/25 = remainder 2
  if (remainder > 0) txNeeded -= 1;
  await erc1155?.setApprovalForAll(gbmAddress, true);

  let promises = [];
  for (let i = 0; i <= txNeeded; i++) {
    if (erc1155) {
      let startIndex = i * auctionSteps;
      let endIndex = startIndex + auctionSteps - 1; // since index = 0
      console.log(`run ${i}`, `${startIndex}`, `${endIndex}`);
      let r = gbm.massRegistrerERC1155Each(
        gbmAddress,
        gbmInitiatorAddress,
        erc1155Address,
        `${auctionConfig.tokenId}`,
        `${startIndex}`,
        `${endIndex}`
      );
      promises.push(r);
    }
  }
  if (remainder > 0) {
    let startIndex = maxAuctions - remainder;
    let endIndex = startIndex + remainder;
    console.log(`remaning ${remainder} ${startIndex} ${endIndex}`);
    let r = gbm.massRegistrerERC1155Each(
      gbmAddress,
      gbmInitiatorAddress,
      erc1155Address,
      `${auctionConfig.tokenId}`,
      `${startIndex}`,
      `${endIndex}`
    );
    promises.push(r);
  }

  // waits for all tx to submit, then returns promise of wait() calls
  let confs = (await Promise.all(promises)).map((r, i) => {
    let startIndex = i * auctionSteps;
    let endIndex = startIndex + auctionSteps - 1;
    // console.log(`tx`, r);
    logger.info({
      tx: {
        createdAt: Date.now(),
        hash: r.hash,
        from: r.from,
        to: r.to,
        chainId: r.chainId,
        nonce: r.nonce,
      },
      params: {
        gbmAddress: gbmAddress,
        gbmInitiatorAddress: gbmInitiatorAddress,
        erc1155Address: erc1155Address,
        startIndex: startIndex,
        endIndex: endIndex,
      },
      config: auctionConfig,
    });
    return r.wait();
  });
  // waits for all confirmations
  await Promise.all(confs);
  // calls process.exit(0) once logger reports complete
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
// console.log(`[!] Creating new auctions with config:`, auctionConfig);
// readline.question(
//   `[?] Current Network: ${hardhat.network.name}, type "yes" to confirm\n`,
//   (arg: string) => {
//     if (arg.toLowerCase() === "yes")
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
// else process.exit(0);
// }
// );

exports.deploy = main;
