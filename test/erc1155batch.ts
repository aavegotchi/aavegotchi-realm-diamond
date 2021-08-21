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

const { deployDiamond } = require("../scripts/deploy");

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
  gbm: string;
  gbmInitiator: string;
  token: string;
  ghst: string;
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
  const itemManager = "0x027Ffd3c119567e85998f4E6B9c3d83D5702660c";
  //Impersonate itemManager

  const accounts = await ethers.getSigners();
  let account = await accounts[0].getAddress();

  console.log("account:", account);

  let signer = await ethers.getSigner(itemManager);

  // const accounts = await ethers.getSigners();
  const nonceManaged = new NonceManager(signer);
  account = await signer.getAddress();

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
  let tokenContract: Contract;
  let tokenAddress: string = auctionConfig.token;

  if (
    auctionConfig.release &&
    auctionConfig.token !== "" &&
    auctionConfig.gbm !== "" &&
    auctionConfig.gbmInitiator !== ""
  ) {
    // mainnet deployment

    console.log(`[${chalk.yellow(`ℹ️`)}] release config, using these addresses:
      GBM: ${auctionConfig.gbm}
      INITIATOR: ${auctionConfig.gbmInitiator}
      ERC TOKEN: ${auctionConfig.token}
      `);

    //  tokenAddress = auctionConfig.token;
    tokenContract = (
      await ethers.getContractAt("ERC1155Generic", tokenAddress)
    ).connect(nonceManaged);
    gbmAddress = auctionConfig.gbm;
    gbmInitiatorAddress = auctionConfig.gbmInitiator;

    gbm = (await ethers.getContractAt("GBM", gbmAddress)).connect(nonceManaged);
  } else {
    // deploying dummy tokens for testing

    console.log(
      `[${chalk.yellow("ℹ️")}] Fresh ${hardhat.network.name} deployment`
    );

    console.log("auctionconfig:", auctionConfig);

    console.log("token address:", tokenAddress);

    tokenContract = (
      await ethers.getContractAt("ERC1155Generic", tokenAddress)
    ).connect(nonceManaged);

    //Deploy GBM Core
    const diamondAddress = await deployDiamond();

    gbm = await ethers.getContractAt("GBMFacet", diamondAddress);
    gbmInitiator = await ethers.getContractAt("SettingsFacet", diamondAddress);

    gbmAddress = diamondAddress; //gbm.address;
    console.log("GBM deployed to:", gbmAddress);
  }

  console.log("Approving token");
  await tokenContract.setApprovalForAll(gbmAddress, true);

  const approval = await tokenContract.isApprovedForAll(
    itemManager,
    gbmAddress
  );

  console.log("Approval:", approval);

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

      const balanceOf = await tokenContract.balanceOf(itemManager, itemId);

      console.log(`balance of: ${itemId}`, balanceOf.toString());

      let txReq = await gbm.registerMassERC1155Each(
        gbmAddress,
        gbmInitiatorAddress,
        tokenAddress,
        itemId,
        `${startIndex}`,
        `${endIndex}`,
        txOps
      );

      console.log("gas used:", utils.formatUnits(txReq.gasLimit, "gwei"));
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
      let txReq = await gbm.registerMassERC1155Each(
        gbmAddress,
        gbmInitiatorAddress,
        tokenAddress,
        itemId,
        `${maxItemAuctions - remaining}`,
        `${startIndex + remaining}`,
        txOps
      );

      console.log("gas used:", utils.formatUnits(txReq.gasLimit, "gwei"));
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
