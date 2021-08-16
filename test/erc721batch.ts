//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
// @ts-ignore
import moment from "moment";
// @ts-ignore
import chalk from "chalk";
import { createLogger, format, transports } from "winston";
import auctionConfig from "../auction.config";
import { NonceManager } from "@ethersproject/experimental";
import { Contract, utils } from "ethers";
const startAt = moment().format("YYYY-MM-DD_HH-mm-ss");
const filename = `logs/${hardhat.network.name}/${auctionConfig.id}/${startAt}.log.json`;
const logger = createLogger({
  level: "info",
  // @ts-ignore
  format: format.combine(format.timestamp(), format.prettyPrint(format.json())),
  defaultMeta: { service: auctionConfig.id },
  transports: [
    new transports.File({
      filename: filename,
    }),
  ],
});
logger.on("finish", () => {
  process.exit(0);
});

async function main() {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  const nonceManagedSigner = new NonceManager(accounts[0]);
  console.log("Deploying Account: " + account + "\n---");

  let totalGasUsed = ethers.BigNumber.from("0");
  let receipt;
  let ghst: Contract;
  let ghstAddress: string;
  let gbm: Contract;
  let gbmInitiator: Contract;
  let gbmAddress: string;
  let gbmInitiatorAddress: string;
  let erc1155: Contract;
  let erc1155Address: string;

  let testing = ["hardhat"].includes(hardhat.network.name);
  let kovan = hardhat.network.name === "kovan";

  console.log(`${chalk.red.underline(hardhat.network.name)} network testing!`);
  if (testing) {
    ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);
    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc1155 = await ERC721Factory.deploy();
    erc1155Address = erc1155.address;

    //Mint 2000 ERC721s
    for (let i = 0; i < auctionConfig.auctionCount; i++) {
      await erc1155["mint()"]();
    }
  } else if (kovan) {
    ghstAddress = "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    let erc721 = await ERC721Factory.deploy();

    //Mint X ERC721s
    let prom = [];
    let nonceManagedContract = erc721.connect(nonceManagedSigner);
    erc1155 = erc721;
    erc1155Address = erc1155.address;
    for (let i = 0; i < auctionConfig.auctionCount; i++) {
      prom.push(nonceManagedContract["mint()"]());
    }
    let res = await Promise.all(prom);
    await Promise.all(res.map((tx) => tx.wait()));
  } else {
    //Set defaults for Matic
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
    // @ts-ignore
    ghstAddress,
    _pixelcraft,
    _playerRewards,
    _daoTreasury
  );

  // used way down where
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
    /* utils.parseEther(
      (auctionConfig.priceFloor > 0 ? auctionConfig.priceFloor : 0).toString()
    )*/
  );

  gbmAddress = gbm.address;
  console.log("GBM deployed to:", gbmAddress);
  gbmInitiatorAddress = gbmInitiator.address;
  console.log("GBMInitiator deployed to:", gbmInitiatorAddress);

  logger.info({
    config: auctionConfig,
  });

  console.log(
    `[${chalk.cyan(hardhat.network.name)} ${chalk.yellow(
      auctionConfig.id
    )}] Creating auctions:
    AMOUNT: ${chalk.yellow(auctionConfig.auctionCount)}
    TYPE: ${chalk.yellow("ERC" + auctionConfig.ercType)}
    START_AT: ${chalk.yellow(auctionConfig.initialIndex)}
    END_AT: ${chalk.yellow(
      auctionConfig.initialIndex + auctionConfig.auctionCount - 1
    )}
    PRICE_FLOOR: 0`
  );

  //@ts-ignore
  await erc1155?.setApprovalForAll(gbmAddress, true);

  if (auctionConfig.ercType == 721) {
    if (auctionConfig.tokenId != 0)
      throw new Error("ERC721 tokenId should be zero, check your config.");
    // console.log(
    //   `Type ERC 721, starts at index ${auctionConfig.initialIndex}, amount of ${
    //     auctionConfig.auctionCount
    //   }, /25 R = ${auctionConfig.auctionCount % 25}`
    // );
  } else if (auctionConfig.ercType == 1155) {
    // console.log(`Type ERC 1155, starts at index ${auctionConfig.initialIndex}`);
  }

  //Register the Auctions
  let auctionSteps = 3; // amount of items in a massRegistrerXEach call
  let maxAuctions = auctionConfig.auctionCount;
  let txNeeded = Math.floor(maxAuctions / auctionSteps);
  let remainder = maxAuctions % auctionSteps; // ie 13/5 = 2 remainder is: 3
  let promises = [];
  for (let i = 0; i < txNeeded; i++) {
    let startIndex = auctionConfig.initialIndex + i * auctionSteps;
    let endIndex = startIndex + auctionSteps; // since index = 0
    let r = await gbm.massRegistrerERC721Each(
      gbmAddress,
      gbmInitiatorAddress,
      erc1155Address,
      `${startIndex}`,
      `${endIndex}`
    );
    // r = await r.wait();
    promises.push(r);
    // console.log(r.wait());

    logger.info({
      tx: {
        hash: r.hash,
        from: r.from,
        to: r.to,
        nonce: r.nonce,
        chainId: r.chainId,
        networkId: hardhat.network.name,
      },
      params: {
        gbmAddress: gbmAddress,
        gbmInitiatorAddress: gbmInitiatorAddress,
        erc1155Address: erc1155Address,
        startIndex: startIndex,
        endIndex: endIndex,
      },
    });
  }
  if (remainder > 0) {
    // last run, include remaining run
    let startIndex = auctionConfig.initialIndex + maxAuctions - remainder;
    let endIndex = startIndex + remainder - 1; // index started at 0
    let r = await gbm.massRegistrerERC721Each(
      gbmAddress,
      gbmInitiatorAddress,
      erc1155Address,
      `${maxAuctions - remainder}`,
      `${startIndex + remainder}`
    );
    // let as = await r.wait();
    logger.info({
      tx: {
        hash: r.hash,
        from: r.from,
        to: r.to,
        chainId: r.chainId,
        nonce: r.nonce,
        networkId: hardhat.network.name,
      },
      params: {
        gbmAddress: gbmAddress,
        gbmInitiatorAddress: gbmInitiatorAddress,
        erc1155Address: erc1155Address,
        startIndex: startIndex,
        endIndex: endIndex,
      },
    });
    // return r.wait();
    promises.push(r.wait());
  }

  await Promise.all(promises);

  console.log(
    `[${chalk.green`✅`}] Completed! Log at ${chalk.yellow(filename)}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

exports.deploy = main;
