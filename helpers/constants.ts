import { BigNumber } from "ethers";
import {
  AlchemicaParams,
} from "./types";

export const GWEI = BigNumber.from(1e9);
export const ETHER = GWEI.mul(GWEI);
export const YEAR = 60 * 60 * 24 * 365;

export const DAO_TREASURY_ADDRESS = "0x6fb7e0AAFBa16396Ad6c1046027717bcA25F821f";
export const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
export const ECOSYSTEM_VESTING_BENEFICIARY = DAO_TREASURY_ADDRESS;
export const GAMEPLAY_VESTING_BENEFICIARY = DAO_TREASURY_ADDRESS;
export const REALM_DIAMOND = DAO_TREASURY_ADDRESS;

export const PROXY_ADMIN_ADDRESS = "0xbE50b0594edeA37C34dF287778d85B9546Fdb309";

export const FUD_ADDRESS = "0xdd4C5431A126c62a2DFA1d4844579e8a25dcAA82";
export const FOMO_ADDRESS = "0xFE34bB4a7eEa6Ed2c8d1655420C1d5E2975B8678";
export const ALPHA_ADDRESS = "0x6933f6411c09646c35c42021B9cFe10963a40A22";
export const KEK_ADDRESS = "0x75253c9f53912FC789210dFA217e3802c26B97d5";

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