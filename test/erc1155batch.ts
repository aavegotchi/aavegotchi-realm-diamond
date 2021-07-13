//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
// @ts-ignore
import moment from "moment";
// @ts-ignore
import chalk from "chalk";
import { createLogger, format, transports } from "winston";
import auctionConfig from "../auction.erc1155.config";
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
  console.log("Deploying Account: " + account + "\n---");

  let totalGasUsed = ethers.BigNumber.from("0");
  let gbm: Contract;
  let gbmInitiator: Contract;
  let gbmAddress: string;
  let gbmInitiatorAddress: string;

  let ghst: Contract;
  let ghstAddress: string;

  let tokenContract: Contract;
  let tokenAddress: string = "";

  console.log(`${chalk.red.underline(hardhat.network.name)} network testing!`);
  if (["hardhat"].includes(hardhat.network.name)) {
    ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);
    //Deploy ERC721 Token for Auction
    const ERC1155Factory = await ethers.getContractFactory("ERC1155Generic");
    tokenContract = await ERC1155Factory.deploy();
    tokenAddress = tokenContract.address;
    await tokenContract["mint(uint256,uint256)"](
      auctionConfig.tokenId,
      auctionConfig.auctionCount
    );
  } else if (hardhat.network.name === "kovan") {
    ghstAddress = "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    if (
      auctionConfig.gbm &&
      auctionConfig.gbmInitiator &&
      auctionConfig.token
    ) {
      const erc = await ethers.getContractAt(
        "ERC1155Generic",
        auctionConfig.token
      );
      tokenContract = erc;
      tokenAddress = erc.address;
    } else {
      const ERC1155Factory = await ethers.getContractFactory("ERC1155Generic");
      let erc721 = await ERC1155Factory.deploy();
      tokenContract = erc721;
      tokenAddress = tokenContract.address;
      await tokenContract["mint(uint256,uint256)"](
        auctionConfig.tokenId,
        auctionConfig.auctionCount
      );
    }
  } else if (["polygon", "matic"].includes(hardhat.network.name)) {
    //Set defaults for Matic
    tokenAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
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
    bidMultiplier,
    utils.parseEther(
      (auctionConfig.priceFloor > 0 ? auctionConfig.priceFloor : 0).toString()
    )
  );

  gbmAddress = gbm.address;
  console.log("GBM deployed to:", gbmAddress);
  gbmInitiatorAddress = gbmInitiator.address;
  console.log("GBMInitiator deployed to:", gbmInitiatorAddress);

  logger.info({
    config: auctionConfig,
  });

  //@ts-ignore
  await tokenContract?.setApprovalForAll(gbmAddress, true);

  console.log(
    `[${chalk.cyan(hardhat.network.name)} ${chalk.yellow(
      auctionConfig.id
    )}] Creating auctions:
    TYPE: ${chalk.yellow("ERC" + auctionConfig.ercType)}
    TOKEN_ID: ${chalk.yellow(auctionConfig.tokenId)}
    AMOUNT: ${chalk.yellow(auctionConfig.auctionCount)}
    START: ${chalk.yellow(auctionConfig.initialIndex)}
    END: ${chalk.yellow(
      auctionConfig.initialIndex + auctionConfig.auctionCount - 1
    )}
    PRICE_FLOOR: ${chalk.yellow(auctionConfig.priceFloor)}`
  );

  // // @ts-ignore
  // console.log(tokenContract);

  let auctionSteps = 25; // amount of items in a massRegistrerXEach call
  let maxAuctions = auctionConfig.auctionCount;
  let txNeeded = Math.floor(maxAuctions / auctionSteps);
  let remainder = maxAuctions % auctionSteps; // ie 13/5 = 2 remainder is: 3
  let promises = [];

  // console.log(
  //   `Total auctions: ${auctionConfig.auctionCount}. Tx to make: ${txNeeded} R ${remainder}`
  // );

  for (let i = 0; i < txNeeded; i++) {
    let startIndex = auctionConfig.initialIndex + i * auctionSteps;
    let endIndex = startIndex + auctionSteps; // since index = 0
    let r = await gbm.massRegistrerERC1155Each(
      gbmAddress,
      gbmInitiatorAddress,
      tokenAddress,
      auctionConfig.tokenId,
      `${startIndex}`,
      `${endIndex}`
    );
    // r = await r.wait();
    promises.push(r.wait());
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
        tokenAddress: tokenAddress,
        tokenId: auctionConfig.tokenId,
        startIndex: startIndex,
        endIndex: endIndex,
      },
    });
  }

  if (remainder > 0) {
    // last run, include remaining run
    let startIndex = auctionConfig.initialIndex + maxAuctions - remainder;
    let endIndex = startIndex + remainder - 1; // index started at 0
    let r = await gbm.massRegistrerERC1155Each(
      gbmAddress,
      gbmInitiatorAddress,
      tokenAddress,
      auctionConfig.tokenId,
      `${maxAuctions - remainder}`,
      `${startIndex + remainder}`
    );
    // let as = await r.wait();
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
        tokenAddress: tokenAddress,
        tokenId: auctionConfig.tokenId,
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
