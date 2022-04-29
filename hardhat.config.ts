/* global task ethers */
import "@typechain/hardhat";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-contract-sizer";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
require("./tasks/generateDiamondABI_realm.js");
require("./tasks/generateDiamondABI_installation.js");
require("./tasks/generateDiamondABI_tile.js");
require("./tasks/verifyFacet.js");
require("./tasks/mintParcels.ts");
require("./tasks/releaseVesting.ts");
require("./tasks/batchTransferAlchemica");

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  mocha: {
    timeout: 2000000,
  },
  etherscan: {
    apiKey: process.env.POLYGON_API_KEY,
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.MATIC_URL,
        timeout: 2000000,
        // blockNumber: 12552123
        // blockNumber: 13024371
      },
      blockGasLimit: 20000000,
      timeout: 2000000,
      gas: "auto",
    },
    localhost: {
      timeout: 800000,
    },
    matic: {
      url: process.env.MATIC_URL,
      // url: 'https://rpc-mainnet.maticvigil.com/',
      accounts: [process.env.SECRET],
      // blockGasLimit: 20000000,
      blockGasLimit: 20000000,
      gasPrice: 100000000000,
      //   timeout: 90000
    },
    mumbai: {
      url: process.env.MUMBAI_URL,
      // url: 'https://rpc-mainnet.maticvigil.com/',
      accounts: [process.env.SECRET],
      // blockGasLimit: 20000000,
      blockGasLimit: 20000000,
      gasPrice: 10000000000,
      //   timeout: 90000
    },
    kovan: {
      url: process.env.KOVAN_URL,
      // url: 'https://rpc-mainnet.maticvigil.com/',
      accounts: [process.env.SECRET],
      // blockGasLimit: 20000000,
      blockGasLimit: 12000000,
      gasPrice: 100000000000,
      //   timeout: 90000
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: false,
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: true,
  },
  // This is a sample solc configuration that specifies which version of solc to use
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};
