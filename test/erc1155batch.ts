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
// @ts-ignore
// import { deployDiamond } from "../scripts/deploy";
// @ts-ignore
import { getSelectors, FacetCutAction } from "../scripts/libraries/diamond.js";

const defaultConfig = conf.default;
const activeConfig = {
  ...defaultConfig,
  // @ts-ignore
  ...conf[hardhat.network.name],
};

const txOps = {
  gasPrice: utils.parseUnits(activeConfig.gasGwei.toString(), "gwei"),
  gasLimit: (20e6).toString(), //20m gwei limit
};

let totalAuctions = Object.values<number>(activeConfig.auctions).reduce(
  (a, b) => a + b,
  0
);
let totalGas = 0;

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

// Init GBM

const pixelcraft = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
const playerRewards = "0x27DF5C6dcd360f372e23d5e63645eC0072D0C098";
const daoTreasury = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

let startTime = Math.floor(Date.now() / 1000);
let endTime = Math.floor(Date.now() / 1000) + 86400;
let hammerTimeDuration = 300;
let bidDecimals = 100000;
let stepMin = 10000;
let incMax = 10000;
let incMin = 1000;
let bidMultiplier = 11120;

const initInfo = {
  startTime,
  endTime,
  hammerTimeDuration,
  bidDecimals,
  stepMin,
  incMax,
  incMin,
  bidMultiplier,
};

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
  // impersonate item manager
  const itemManager = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  let account = itemManager;
  let diamondAddress: string = "";
  console.log(`${diamondAddress} should be the gbm diamond`);
  let tokenAddress: string = auctionConfig.token;
  console.log(`${tokenAddress} should be the address for erc1155s`);
  let nonceManaged: NonceManager;
  let ghstAddress: string = auctionConfig.ghst;
  console.log(
    `${ghstAddress} should be the ghst token on ${hardhat.network.name}`
  );
  const contractAddresses = {
    erc20Currency: ghstAddress,
    pixelcraft,
    playerRewards,
    daoTreasury,
  };
  console.log(`Contract addresses:`, contractAddresses);

  if (["matic", "hardhat"].includes(hardhat.network.name.toLowerCase())) {
    console.log(`Active on mainnet!`);
    // @TODO: set this to mainnet gbm diamond that was deployed by deployDiamond()
    diamondAddress = "0xa44c8e0eCAEFe668947154eE2b803Bd4e6310EFe"; // diamond returned from deployDiamond
    const accounts = await ethers.getSigners();
    const signer = accounts[0];
    nonceManaged = new NonceManager(signer);
    account = await signer.getAddress();
    console.log(`Signing on mainnet as: `, account);
  } else {
    // localnet fork, deploy gbm owned by itemManager
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [itemManager],
    });

    const signer = await ethers.provider.getSigner(itemManager);
    const account = await signer.getAddress();
    nonceManaged = new NonceManager(signer);
    console.log("signing account is Itemmanager:", account);
    console.log(
      `${chalk.red.underline(
        hardhat.network.name
      )} network, sign/deploy account: ${account}!\n---"`
    );

    // //Deploy GBM Core
    // const diamondAddress: string = await deployDiamond();
    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
    const diamondCutFacet = await DiamondCutFacet.deploy();
    await diamondCutFacet.deployed();
    console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

    // deploy Diamond
    const Diamond = await ethers.getContractFactory("Diamond");
    const diamond = await Diamond.connect(signer).deploy(
      itemManager,
      diamondCutFacet.address
    );
    await diamond.deployed();
    diamondAddress = diamond.address;
    console.log("Diamond deployed:", diamond.address);

    // deploy DiamondInit
    const DiamondInit = await ethers.getContractFactory("DiamondInit");
    const diamondInit = await DiamondInit.connect(signer).deploy();
    await diamondInit.deployed();
    console.log("DiamondInit deployed:", diamondInit.address);

    // deploy facets
    console.log("");
    console.log("Deploying facets");
    const FacetNames = [
      "DiamondLoupeFacet",
      "OwnershipFacet",
      "SettingsFacet",
      "GBMFacet",
    ];
    const cut = [];
    for (const FacetName of FacetNames) {
      const Facet = await ethers.getContractFactory(FacetName);
      const facet = await Facet.connect(signer).deploy();
      await facet.deployed();
      console.log(`${FacetName} deployed: ${diamondInit.address}`);
      cut.push({
        facetAddress: facet.address,
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(facet),
      });
    }

    // upgrade diamond with facets
    // console.log("Diamond Cut:", cut);
    const diamondCut = (
      await ethers.getContractAt("IDiamondCut", diamond.address)
    ).connect(signer);
    const pk = process.env.GBM_PK || "";
    let backendSigner = new ethers.Wallet(pk); // PK should start with '0x'
    // call to init function
    let functionCall = diamondInit.interface.encodeFunctionData("init", [
      contractAddresses,
      initInfo,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
    ]);
    const tx = await diamondCut.diamondCut(
      cut,
      diamondInit.address,
      functionCall
    );
    console.log("Diamond cut tx: ", tx.hash);
    const receipt = await tx.wait();
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`);
    }
    console.log("Completed diamond cut");

    const gbmInitiator: Contract = await ethers.getContractAt(
      "SettingsFacet",
      diamondAddress
    );
    console.log(
      `[${chalk.yellow("ℹ️")}] Fresh ${hardhat.network.name} deployment`
    );
    console.log("token address:", tokenAddress);
    console.log("GBM deployed to:", diamondAddress);
  }

  // approve diamondAddress, one of these probably works
  // connect to erc1155 interface with managed signer
  console.log("Approving token");
  console.log("token address:", tokenAddress);
  console.log("diamond address:", diamondAddress);
  const tokenContract: Contract = (
    await ethers.getContractAt("ERC1155Generic", tokenAddress)
  ).connect(nonceManaged);
  await tokenContract
    .connect(nonceManaged)
    .setApprovalForAll(diamondAddress, true);

  const gbm: Contract = (
    await ethers.getContractAt("GBMFacet", diamondAddress)
  ).connect(nonceManaged);
  const approvalGbm = await tokenContract.isApprovedForAll(
    itemManager,
    diamondAddress
  );
  console.log("Checking, was approval granted? ", approvalGbm);
  if (!approvalGbm)
    throw new Error(`Wont have permission to transfer items to gbm`);

  let allBalancesMatch = true;
  for (let index in auctionConfig.initOrdering) {
    const expectId = auctionConfig.initOrdering[index];
    const expectBalance = auctionConfig.auctions[expectId];
    const bal = await tokenContract.balanceOf(itemManager, expectId);
    const balanceMatchesQty =
      parseInt(bal.toString()) == parseInt(expectBalance.toString());
    console.log(
      `Checking request auction of item (${expectId}) x (${expectBalance}) matches owned total: ${bal}`,
      balanceMatchesQty
    );
    if (!balanceMatchesQty) allBalancesMatch = balanceMatchesQty;
  }
  if (!allBalancesMatch)
    throw new Error(`Signer is missing full quantity of auction listings`);

  console.log(
    `all checks passed, transactions will be queued. Wait for completion.`
  );
  logger.info({
    activeConfig: activeConfig,
    auctionConfig: auctionConfig,
  });

  let auctionSteps = 60; // amount of items in a massRegistrerXEach call, must avoid exceeding block size
  let promises: Promise<any>[] = [];
  auctionConfig.initOrdering.map(async (itemId) => {
    // taking each itemId from the auctionConfig.auctions field
    // registers X new auctions of itemId from the owner with gbm

    let maxItemAuctions = auctionConfig.auctions[itemId];
    // tx needed for total amount
    let maxItemTx = Math.floor(maxItemAuctions / auctionSteps);
    // overflow tx amount when qty doesnt divide as whole num
    let remaining = maxItemAuctions % auctionSteps;

    // const balanceOf = await tokenContract.balanceOf(itemManager, itemId);
    // console.log(`balance of ${itemId}: ${balanceOf}`);

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

      // const balanceOf = await tokenContract.balanceOf(itemManager, itemId);
      // console.log(`balance of: ${itemId}`, balanceOf.toString());

      let txReq = await gbm.registerMassERC1155Each(
        diamondAddress,
        true,
        tokenAddress,
        itemId,
        `${startIndex}`,
        `${endIndex}`,
        txOps
      );

      // console.log(
      //   "gas used:",
      //   utils.formatUnits(txReq.gasLimit, "gwei"),
      //   txReq.hash
      // );
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
          gbmAddress: diamondAddress,
          tokenAddress: tokenAddress,
          tokenId: itemId,
          startIndex: startIndex,
          endIndex: endIndex,
        },
      });
      promises.push(await txReq.wait());
    }
    if (remaining > 0) {
      // last run, include remaining run
      // let startIndex = auctionConfig.initialIndex + maxItemAuctions - remaining;
      let startIndex = 0 + maxItemAuctions - remaining;
      let endIndex = startIndex + remaining - 1; // index started at 0
      let txReq = await gbm.registerMassERC1155Each(
        diamondAddress,
        true,
        tokenAddress,
        itemId,
        `${maxItemAuctions - remaining}`,
        `${startIndex + remaining}`,
        txOps
      );

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
          gbmAddress: diamondAddress,
          tokenAddress: tokenAddress,
          tokenId: itemId,
          startIndex: startIndex,
          endIndex: endIndex,
        },
      });
      promises.push(await txReq.wait());
    }
    console.log(
      `[${chalk.green(`✅`)}] Registered itemId: ${chalk.yellow(
        itemId
      )} x ${chalk.yellow(maxItemAuctions)} in ${chalk.yellow(
        maxItemTx + (remaining > 0 ? 1 : 0)
      )} txs!`
    );
  });

  console.log(
    `[${chalk.yellow(`ℹ️`)}] Queue in-progress, will exit when done logging!
    LOG: ${chalk.yellow(filename)}`
  );
  await Promise.all(promises);
}

logger.on("finish", () => {
  // console.log(`total Gas: `, totalGas);
  // waits for logger to finish before exiting
  process.exit(0);
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

exports.deploy = main;
