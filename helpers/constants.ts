import { BigNumber, ethers } from "ethers";
import {
  AlchemicaParams,
} from "./types";

export const GWEI = BigNumber.from(1e9);
export const ETHER = GWEI.mul(GWEI);
export const YEAR = 60 * 60 * 24 * 365;


export const DAO_TREASURY_ADDRESS = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f";
export const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
export const ECOSYSTEM_VESTING_BENEFICIARY = DAO_TREASURY_ADDRESS;
export const REALM_DIAMOND = "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";
export const GHST_ADDRESS = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
export const QUICKSWAP_ROUTER_ADDRESS = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";

export const PROXY_ADMIN_ADDRESS = "0xbE50b0594edeA37C34dF287778d85B9546Fdb309";

export const FUD_ADDRESS = "0xdd4C5431A126c62a2DFA1d4844579e8a25dcAA82";
export const FOMO_ADDRESS = "0xFE34bB4a7eEa6Ed2c8d1655420C1d5E2975B8678";
export const ALPHA_ADDRESS = "0x6933f6411c09646c35c42021B9cFe10963a40A22";
export const KEK_ADDRESS = "0x75253c9f53912FC789210dFA217e3802c26B97d5";

export const DOMAIN_TYPES = [
  {
    name: "name",
    type: "string",
  },
  {
    name: "version",
    type: "string",
  },
  {
    name: "chainId",
    type: "uint256",
  },
  {
    name: "verifyingContract",
    type: "address",
  },
];

export const PERMIT_TYPES = {
  //EIP712Domain: DOMAIN_TYPES,
  Permit: [
    { name: "owner", type: "address", },
    { name: "spender", type: "address", },
    { name: "value", type: "uint256", },
    { name: "nonce", type: "uint256", },
    { name: "deadline", type: "uint256", },
  ],
};

export const FUD_PARAMS: AlchemicaParams = {
  name: "Gotchiverse FUD",
  symbol: "FUD",
  supply: BigNumber.from(100).mul(ETHER).mul(GWEI),
};
export const FOMO_PARAMS: AlchemicaParams = {
  name: "Gotchiverse FOMO",
  symbol: "FOMO",
  supply: BigNumber.from(50).mul(ETHER).mul(GWEI),
};
export const ALPHA_PARAMS: AlchemicaParams = {
  name: "Gotchiverse ALPHA",
  symbol: "ALPHA",
  supply: BigNumber.from(25).mul(ETHER).mul(GWEI),
};
export const KEK_PARAMS: AlchemicaParams = {
  name: "Gotchiverse KEK",
  symbol: "KEK",
  supply: BigNumber.from(10).mul(ETHER).mul(GWEI),
};

export const INITIAL_ALCHEMICA_SEED: 
[[BigNumber, BigNumber, BigNumber, BigNumber], 
  [BigNumber, BigNumber, BigNumber, BigNumber]] = 
[[
  BigNumber.from(ETHER.mul(4_196_056_910).div(1000)), // 4,196,056.91 FUD
  BigNumber.from(ETHER.mul(2_098_028_450).div(1000)), // 2,098,028.45 FOMO
  BigNumber.from(ETHER.mul(1_049_014_230).div(1000)), // 1,049,014.23 ALPHA
  BigNumber.from(ETHER.mul(419_605_690).div(1000)), // 419,605.69 KEK
],
[
  BigNumber.from(ETHER.mul(2500)), // GHST
  BigNumber.from(ETHER.mul(2500)),
  BigNumber.from(ETHER.mul(2500)),
  BigNumber.from(ETHER.mul(2500)),
]];