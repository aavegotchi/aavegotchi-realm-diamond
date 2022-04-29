/* global ethers hre */
/* eslint prefer-const: "off" */

import { AlchemicaToken, RealmFacet } from "../../typechain";
import { alchemica, maticDiamondAddress } from "../../constants";

//@ts-ignore
// import hardhat, { run, ethers } from "hardhat";

import { ethers } from "hardhat";

export async function getAuctionID() {
  console.log("hello");

  const abi = [
    {
      inputs: [
        { internalType: "address", name: "_logic", type: "address" },
        { internalType: "address", name: "admin_", type: "address" },
        { internalType: "bytes", name: "_data", type: "bytes" },
      ],
      stateMutability: "payable",
      type: "constructor",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "previousAdmin",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "newAdmin",
          type: "address",
        },
      ],
      name: "AdminChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "beacon",
          type: "address",
        },
      ],
      name: "BeaconUpgraded",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "implementation",
          type: "address",
        },
      ],
      name: "Upgraded",
      type: "event",
    },
    { stateMutability: "payable", type: "fallback" },
    {
      inputs: [],
      name: "admin",
      outputs: [{ internalType: "address", name: "admin_", type: "address" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newAdmin", type: "address" }],
      name: "changeAdmin",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "implementation",
      outputs: [
        { internalType: "address", name: "implementation_", type: "address" },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "newImplementation", type: "address" },
      ],
      name: "upgradeTo",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "newImplementation", type: "address" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "upgradeToAndCall",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    { stateMutability: "payable", type: "receive" },
  ];

  for await (const token of alchemica) {
    const tokenContract = (await ethers.getContractAt(
      "AlchemicaToken",
      token
    )) as AlchemicaToken;

    const proxy = await ethers.getContractAt(abi, token);

    const owner = await tokenContract.owner();
    console.log("owner:", owner);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  getAuctionID()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
