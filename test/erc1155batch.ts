// @ts-ignore
import moment from "moment";
const startAt = moment().format("YYYY-MM-DD_HH-mm-ss");
import conf from "../auction.erc1155.config";
//@ts-ignore
import hardhat, { ethers } from "hardhat";
// @ts-ignore
import chalk from "chalk";
import { createLogger, format, transports } from "winston";
import { Contract, utils } from "ethers";
import { NonceManager } from "@ethersproject/experimental";

const defaultConfig = conf.default;
const activeConfig = {
  ...defaultConfig,
  // @ts-ignore
  ...conf[hardhat.network.name],
};

const txOps = {
  gasPrice: utils.parseUnits(activeConfig.gasGwei.toString(), "gwei"),
};

let totalAuctions = Object.values<number>(activeConfig.auctions).reduce(
  (a, b) => a + b,
  0
);

interface LocalConf {
  id: string;
  gbm?: string;
  gbmInitiator?: string;
  token?: string;
  ghst?: string;
  totalAuctions: number;
  release: boolean;
  auctions: any;
  initOrdering: number[];
}

const auctionConfig: LocalConf = {
  ...activeConfig,
  totalAuctions: totalAuctions,
  initOrdering: Object.keys(activeConfig.auctions).map((x) => parseInt(x)),
};

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

async function main() {
  const accounts = await ethers.getSigners();
  const nonceManaged = new NonceManager(accounts[0]);
  const account = await accounts[0].getAddress();
  console.log(
    `${chalk.red.underline(
      hardhat.network.name
    )} network, sign/deploy account: ${account}!\n---"`
  );

  let gbm: Contract;
  let gbmAddress: string;

  let gbmInitiator: Contract;
  let gbmInitiatorAddress: string;

  let ghstAddress = auctionConfig.ghst;
  // let ghst: Contract = await ethers.getContractAt("ERC20Generic", ghstAddress);

  let tokenContract: Contract;
  let tokenAddress: string = "";

  if (
    auctionConfig.release &&
    auctionConfig.token &&
    auctionConfig.gbm &&
    auctionConfig.gbmInitiator
  ) {
    // mainnet deployment
    console.log(`[${chalk.yellow(`ℹ️`)}] release config, using these addresses:
      GBM: ${auctionConfig.gbm}
      INITIATOR: ${auctionConfig.gbmInitiator}
      ERC TOKEN: ${auctionConfig.token}
      `);

    tokenAddress = auctionConfig.token;
    tokenContract = (
      await ethers.getContractAt("ERC1155Generic", tokenAddress)
    ).connect(nonceManaged);
    gbmAddress = auctionConfig.gbm;
    gbmInitiatorAddress = auctionConfig.gbmInitiator;
  } else {
    // deploying dummy tokens for testing

    console.log(
      `[${chalk.yellow("ℹ️")}] Fresh ${hardhat.network.name} deployment`
    );

    //Deploys ERC1155 Token for Auction
    const ERC1155Factory = (
      await ethers.getContractFactory("ERC1155Generic")
    ).connect(nonceManaged);
    tokenContract = (await ERC1155Factory.deploy()).connect(nonceManaged);
    tokenAddress = tokenContract.address;
    auctionConfig.initOrdering.map(async (itemId) => {
      await tokenContract["mint(uint256,uint256)"](
        itemId,
        auctionConfig.auctions[itemId]
      );
    });

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
    gbm = await GBMContractFactory.connect(nonceManaged).deploy(
      // @ts-ignore
      ghstAddress,
      _pixelcraft,
      _playerRewards,
      _daoTreasury
    );

    const GBMContractInitiatorFactory = await ethers.getContractFactory(
      "GBMInitiator"
    );
    gbmInitiator = await GBMContractInitiatorFactory.connect(
      nonceManaged
    ).deploy(
      startTime,
      endTime,
      hammerTimeDuration,
      bidDecimals,
      stepMin,
      incMin,
      incMax,
      bidMultiplier,
      "0"
      // utils.parseEther(
      //   (auctionConfig.priceFloor > 0 ? auctionConfig.priceFloor : 0).toString()
      // )
    );

    gbmAddress = gbm.address;
    console.log("GBM deployed to:", gbmAddress);
    gbmInitiatorAddress = gbmInitiator.address;
    console.log("GBMInitiator deployed to:", gbmInitiatorAddress);
  }

  // approved gbmAddress to list the token
  if (gbmAddress && tokenContract)
    await tokenContract.setApprovalForAll(gbmAddress, true);

  logger.info({
    activeConfig: activeConfig,
    auctionConfig: auctionConfig,
  });

  let auctionSteps = 30; // amount of items in a massRegistrerXEach call, must avoid exceeding block size
  let promises: Promise<any>[] = [];
  auctionConfig.initOrdering.map(async (itemId) => {
    // taking each itemId from the auctionConfig.auctions field
    // registers X new auctions of itemId from the owner with gbm

    let maxItemAuctions = auctionConfig.auctions[itemId];
    // tx needed for total amount
    let maxItemTx = Math.floor(maxItemAuctions / auctionSteps);
    // overflow tx amount when qty doesnt divide as whole num
    let remaining = maxItemAuctions % auctionSteps;

    console.log(
      `[${chalk.cyan(hardhat.network.name)} ${chalk.yellow(
        auctionConfig.id
      )}] Creating auctions:
      TOKEN_ID: ${chalk.yellow(itemId)}
      AMOUNT: ${chalk.yellow(maxItemAuctions)}`
    );

    for (let i = 0; i < maxItemTx; i++) {
      // let startIndex = auctionConfig.initialIndex + i * auctionSteps;
      let startIndex = 0 + i * auctionSteps;
      let endIndex = startIndex + auctionSteps; // since index = 0
      let txReq = await gbm.massRegistrerERC1155Each(
        gbmAddress,
        gbmInitiatorAddress,
        tokenAddress,
        itemId,
        `${startIndex}`,
        `${endIndex}`,
        txOps
      );
      // totalGas += parseFloat(utils.formatUnits(txReq.gasLimit, "gwei"));

      logger.info({
        tx: {
          hash: txReq.hash,
          from: txReq.from,
          to: txReq.to,
          nonce: txReq.nonce,
          chainId: txReq.chainId,
          networkId: hardhat.network.name,
        },
        params: {
          gbmAddress: gbmAddress,
          gbmInitiatorAddress: gbmInitiatorAddress,
          tokenAddress: tokenAddress,
          tokenId: itemId,
          startIndex: startIndex,
          endIndex: endIndex,
        },
      });
      promises.push(txReq.wait());
    }
    if (remaining > 0) {
      // last run, include remaining run
      // let startIndex = auctionConfig.initialIndex + maxItemAuctions - remaining;
      let startIndex = 0 + maxItemAuctions - remaining;
      let endIndex = startIndex + remaining - 1; // index started at 0
      let txReq = await gbm.massRegistrerERC1155Each(
        gbmAddress,
        gbmInitiatorAddress,
        tokenAddress,
        itemId,
        `${maxItemAuctions - remaining}`,
        `${startIndex + remaining}`,
        txOps
      );
      // totalGas += parseFloat(utils.formatUnits(txReq.gasLimit, "gwei"));

      // let as = await r.wait();
      logger.info({
        tx: {
          hash: txReq.hash,
          from: txReq.from,
          to: txReq.to,
          nonce: txReq.nonce,
          chainId: txReq.chainId,
          networkId: hardhat.network.name,
        },
        params: {
          gbmAddress: gbmAddress,
          gbmInitiatorAddress: gbmInitiatorAddress,
          tokenAddress: tokenAddress,
          tokenId: itemId,
          startIndex: startIndex,
          endIndex: endIndex,
        },
      });
      promises.push(txReq.wait());
    }
    console.log(
      `[${chalk.green(`✅`)}] Registered itemId: ${chalk.yellow(
        itemId
      )} x ${chalk.yellow(maxItemAuctions)} in ${chalk.yellow(
        maxItemTx + (remaining > 0 ? 1 : 0)
      )} txs!`
    );
  });

  await Promise.all(promises);

  console.log(
    `[${chalk.yellow(`ℹ️`)}] Queue in-progress, will exit when done logging!
      LOG: ${chalk.yellow(filename)}`
  );
}

logger.on("finish", () => {
  // waits for logger to finish before exiting
  process.exit(0);
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

exports.deploy = main;
