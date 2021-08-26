//@ts-ignore
import hardhat, { run, ethers } from "hardhat";
// @ts-ignore
import moment from "moment";
// @ts-ignore
import chalk from "chalk";
import { createLogger, format, transports } from "winston";
import auctionConfig from "../auction.config";
import { NonceManager } from "@ethersproject/experimental";
import { Contract, BigNumber, utils } from "ethers";
const { h2tokenIds } = require("../data/h2tokenIds");

const { deployDiamond } = require("../scripts/deploy");

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

async function deployAuctions(
  preset: "none" | "low" | "medium" | "high" | "degen" | "test"
) {
  const accounts = await ethers.getSigners();
  const account = await accounts[0].getAddress();
  const nonceManagedSigner = new NonceManager(accounts[0]);
  console.log("Deploying Account: " + account + "\n---");

  let totalGasUsed: BigNumber = ethers.BigNumber.from("0");
  let ghst: Contract;
  let ghstAddress: string;
  let gbm: Contract;
  let gbmInitiator: Contract;
  let gbmAddress: string;
  let erc721: Contract;
  let erc721address: string;

  let testing = ["hardhat"].includes(hardhat.network.name);
  let kovan = hardhat.network.name === "kovan";

  console.log(
    `${chalk.red.underline(
      hardhat.network.name
    )} network testing with ${chalk.red.underline(preset)} preset!`
  );

  const diamondAddress = await deployDiamond();

  gbm = await ethers.getContractAt("GBMFacet", diamondAddress);
  gbmInitiator = await ethers.getContractAt("SettingsFacet", diamondAddress);

  gbmAddress = diamondAddress; //gbm.address;
  console.log("GBM deployed to:", gbmAddress);

  logger.info({
    config: auctionConfig,
  });

  //Begin Auctions

  const presetInfo = auctionConfig.auctionPresets[preset];
  await gbmInitiator.setInitiatorInfo(presetInfo);

  const initiatorInfo = await gbmInitiator.getInitiatorInfo();
  // console.log("info:", initiatorInfo);

  //Change this to correct preset
  if (
    initiatorInfo.bidMultiplier.toString() !==
    auctionConfig.auctionPresets[preset].bidMultiplier.toString()
  ) {
    console.log("Presets were not uploaded correctly! Exiting");
    process.exit(1);
  }

  console.log(`Presets are set for ${preset.toUpperCase()}, LFG!`);

  if (testing) {
    ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);
    //Deploy ERC721 Token for Auction
    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    erc721 = await ERC721Factory.deploy();
    erc721address = erc721.address;

    console.log("deploying");

    //Mint 2000 ERC721s

    console.log(
      `Minting ${
        auctionConfig.auctionTokenCounts[preset]
      } ${preset.toUpperCase()} Portals`
    );

    for (let i = 0; i < auctionConfig.auctionTokenCounts[preset]; i++) {
      await erc721["mint()"]();
    }
  } else if (kovan) {
    ghstAddress = "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5";
    ghst = await ethers.getContractAt("ERC20Generic", ghstAddress);

    const ERC721Factory = await ethers.getContractFactory("ERC721Generic");
    let erc721 = await ERC721Factory.deploy();

    //Mint X ERC721s
    let prom = [];
    let nonceManagedContract = erc721.connect(nonceManagedSigner);
    erc721 = erc721;
    erc721address = erc721.address;
    for (let i = 0; i < auctionConfig.auctionTokenCounts[preset]; i++) {
      prom.push(nonceManagedContract["mint()"]());
    }
    let res = await Promise.all(prom);
    await Promise.all(res.map((tx) => tx.wait()));
  } else {
    //Set defaults for Matic
    erc721address = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  }

  //@ts-ignore
  const approval = await erc721?.isApprovedForAll(account, gbmAddress);
  console.log("approval:", approval);

  if (!approval) {
    //@ts-ignore
    await erc721?.setApprovalForAll(gbmAddress, true);
  }

  console.log(
    `[${chalk.cyan(hardhat.network.name)} ${chalk.yellow(
      auctionConfig.id
    )}] Creating auctions for ${preset.toUpperCase()} Preset:
    AMOUNT: ${chalk.yellow(auctionConfig.auctionTokenCounts[preset])}
    TYPE: ${chalk.yellow("ERC" + auctionConfig.ercType)}
    START_AT: ${chalk.yellow(auctionConfig.initialIndex)}
    END_AT: ${chalk.yellow(
      auctionConfig.initialIndex + auctionConfig.auctionTokenCounts[preset] - 1
    )}`
  );

  //Register the Auctions
  let auctionSteps = 5; // amount of items in a massRegistrerXEach call
  //let maxAuctions = auctionConfig.auctionTokenCounts[preset];

  let promises = [];
  let tokenIds = h2tokenIds[preset];

  console.log("token ids:", tokenIds);

  let sent = 0;
  let remaining = tokenIds.length - sent;

  for (let i = 0; i < remaining; i++) {
    let startIndex = auctionConfig.initialIndex + i * auctionSteps;
    let endIndex = startIndex + auctionSteps; // since index = 0
    let r = await gbm.registerMassERC721Each(
      gbmAddress,
      true,
      erc721address,
      tokenIds.splice(sent, sent + auctionSteps)
    );

    console.log(
      `Creating auctions ${startIndex} to ${endIndex}, using ${r.gasLimit.toString()} gas`
    );

    totalGasUsed = totalGasUsed.add(r.gasLimit);

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
        useDefault: true,
        erc721address: erc721address,
        startIndex: startIndex,
        endIndex: endIndex,
      },
    });
  }

  await Promise.all(promises);

  console.log(
    `[${chalk.green`✅`}] Completed! Log at ${chalk.yellow(filename)}`
  );

  console.log("Used Gas:", totalGasUsed.toString());
}

deployAuctions("test")
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = deployAuctions;
