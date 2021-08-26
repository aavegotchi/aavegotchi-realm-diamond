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
import { request } from "graphql-request";
const { h2tokenIds } = require("../data/h2tokenIds");

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

const gasPrice = 50000000000;

async function prepareAuction(
  preset: "none" | "low" | "medium" | "high" | "degen" | "test"
) {
  const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  let gbm: Contract;
  let gbmInitiator: Contract;
  let gbmAddress: string;
  // let erc721: Contract;

  let testing = ["hardhat"].includes(hardhat.network.name);
  let nonceManagedSigner;

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });
    const signer = await ethers.provider.getSigner(itemManager);

    nonceManagedSigner = new NonceManager(signer);
    console.log("Deploying Account: " + itemManager + "\n---");
  } else {
    const accounts = await ethers.getSigners();
    const account = await accounts[0].getAddress();
    nonceManagedSigner = new NonceManager(accounts[0]);
    console.log("Deploying Account: " + account + "\n---");
  }

  console.log(
    `${chalk.cyan.underline(
      hardhat.network.name
    )} network testing with ${chalk.red.underline(preset)} preset!`
  );

  const diamondAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe";

  gbm = await ethers.getContractAt(
    "GBMFacet",
    diamondAddress,
    nonceManagedSigner
  );
  gbmInitiator = await ethers.getContractAt(
    "SettingsFacet",
    diamondAddress,
    nonceManagedSigner
  );

  gbmAddress = diamondAddress; //gbm.address;
  // console.log("GBM deployed to:", gbmAddress);

  logger.info({
    config: auctionConfig,
  });

  //Begin Auctions

  console.log(`Setting Preset for ${chalk.red(preset)}`);
  const presetInfo = auctionConfig.auctionPresets[preset];
  const tx = await gbmInitiator.setInitiatorInfo(presetInfo, {
    gasPrice: gasPrice,
  });

  await tx.wait();

  const initiatorInfo = await gbmInitiator.getInitiatorInfo();
  console.log(
    "start time:",
    new Date(Number(initiatorInfo.startTime.toString()) * 1000)
  );
  console.log(
    "end time:",
    new Date(Number(initiatorInfo.endTime.toString()) * 1000)
  );

  console.log("Bid Multiplier:", initiatorInfo.bidMultiplier.toString());

  //Change this to correct preset
  if (
    initiatorInfo.bidMultiplier.toString() !==
    auctionConfig.auctionPresets[preset].bidMultiplier.toString()
  ) {
    console.log("Presets were not uploaded correctly! Exiting");
    process.exit(1);
  } else {
    await deployAuction(
      preset,
      nonceManagedSigner,
      gbmAddress,
      itemManager,
      gbm
    );
  }
}

async function deployAuction(
  preset: "none" | "low" | "medium" | "high" | "degen" | "test",
  nonceManagedSigner: NonceManager,
  gbmAddress: string,
  itemManager: string,
  gbm: Contract
) {
  let totalGasUsed: BigNumber = ethers.BigNumber.from("0");

  let erc721address: string;

  console.log(`Presets are set for ${preset.toUpperCase()}, LFG!`);

  //  else {
  //Set defaults for Matic
  erc721address = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  // }

  const erc721 = await ethers.getContractAt(
    "ERC721Generic",
    erc721address,
    nonceManagedSigner
  );

  const approval = await erc721.isApprovedForAll(itemManager, gbmAddress);
  console.log("approval:", approval);

  const balanceOf = await erc721?.balanceOf(itemManager);
  console.log("Item Manager Balance:", balanceOf.toString());

  if (!approval) {
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
  let auctionSteps = 1; // amount of items in a massRegistrerXEach call
  //let maxAuctions = auctionConfig.auctionTokenCounts[preset];

  let promises = [];
  let tokenIds = h2tokenIds[preset];

  const query = `
  {auctions(where:{type:"erc721", incentivePreset:"${preset}"}) {
    id
    tokenId
  }}
  `;
  const url =
    "https://aavegotchi2.stakesquid-frens.gq/subgraphs/id/QmRJbPF5W1ujDUUZymmeYu4Xo7xfSP6gmi8NHDbX99pDDL";

  const response = await request(url, query);

  console.log("response:", response);

  let deployed: string[] = [];
  response.auctions.forEach((auctionObj: any) => {
    deployed.push(auctionObj.tokenId);
  });

  console.log("Already deployed:", deployed);

  console.log(
    `${chalk.red(preset)} preset has ${tokenIds.length} tokens to mint.`
  );

  let sent = 0;

  //filter out the deployed tokenIds from the preset
  let filteredTokenIds = tokenIds.filter((tokenId: number) => {
    return !deployed.includes(tokenId.toString());
  });

  let remaining = filteredTokenIds.length - sent;

  console.log("filtered token ids:", filteredTokenIds);

  while (remaining > 0) {
    if (remaining < auctionSteps) auctionSteps = remaining;

    console.log("remaining:", remaining);

    let finalTokenIds: number[] = filteredTokenIds.slice(
      sent,
      sent + auctionSteps
    );
    if (finalTokenIds.length > 0) {
      console.log(`Creating Auctions for ${finalTokenIds.toString()}`);
      let r = await gbm.registerMassERC721Each(
        gbmAddress,
        true,
        erc721address,
        finalTokenIds,
        { gasPrice: gasPrice }
      );
      console.log("tx hash:", r.hash);

      console.log(
        `Created auctions for ${finalTokenIds.toString()}, using ${r.gasLimit.toString()} gas`
      );

      totalGasUsed = totalGasUsed.add(r.gasLimit);

      promises.push(r);

      sent += auctionSteps;
      remaining -= auctionSteps;

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
          tokenIds: tokenIds.slice(sent, sent + auctionSteps),
        },
      });
    } else {
      throw "That's it!";
    }
  }

  await Promise.all(promises);

  console.log(
    `[${chalk.green`✅`}] Completed! Log at ${chalk.yellow(filename)}`
  );

  console.log("Used Gas:", totalGasUsed.toString());
}

prepareAuction("low")
  .then(() => process.exit(1))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

exports.deploy = prepareAuction;
