import { HardhatEthersHelpers } from "hardhat/types";

export interface Constants {
  aavegotchiDiamond: string;
  realmDiamond: string;
  installationDiamond: string;
  tileDiamond: string;
  fud: string;
  fomo: string;
  alpha: string;
  kek: string;
  gltr: string;
  ghst: string;
  defenderRelayer?: string;
}

interface NetworkToConstants {
  [network: number]: Constants;
}

export interface Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

function varsByChainId(chainId: number) {
  if ([137, 80001].includes(chainId)) return networkToVars[chainId];
  else return networkToVars[137];
}

export async function varsForNetwork(ethers: HardhatEthersHelpers) {
  return varsByChainId((await ethers.provider.getNetwork()).chainId);
}
export const gotchiverseSubgraph =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic";

export const alchemica = [
  "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
  "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
  "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
  "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
];

const kovanVars: Constants = {
  aavegotchiDiamond: "0xa37D0c085121B6b7190A34514Ca28fC15Bb4dc22",
  realmDiamond: "",
  installationDiamond: "",
  tileDiamond: "",
  fud: "",
  fomo: "",
  alpha: "",
  kek: "",
  gltr: "",
  ghst: "",
};

export const maticVars: Constants = {
  aavegotchiDiamond: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  realmDiamond: "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11",
  installationDiamond: "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A",
  tileDiamond: "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355",
  fud: "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
  fomo: "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
  alpha: "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
  kek: "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
  gltr: "0x3801c3b3b5c98f88a9c9005966aa96aa440b9afc",
  ghst: "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7",
  defenderRelayer: "0xb6384935d68e9858f8385ebeed7db84fc93b1420",
};

const mumbaiVars: Constants = {
  aavegotchiDiamond: "0x83e73D9CF22dFc3A767EA1cE0611F7f50306622e",
  realmDiamond: "0xBcCf68d104aCEa36b1EA20BBE8f06ceD12CaC008",
  installationDiamond: "0x2fD1C70728f686AE5f30734C20924a0Db1Df14e6",
  tileDiamond: "0xCbc2682E1Dd543557174c4168Ce33c7B358f5a1B",
  fud: "0x1D349EB5c7FBC586892C8903B0565cf1684ef111",
  fomo: "0xd33259671Db89b82d6fFf0ed043FeCcEB6D72270",
  alpha: "0xbC59FD59163E9F32Be1E1c836fBADd34525cf798",
  kek: "0x419Cd8C320C485A2169C5Bc7FAA49f563Cd16B78",
  gltr: "0xcBcDae5769d31B468402e695a32277E29b1FEc06",
  ghst: "",
};

const networkToVars: NetworkToConstants = {
  137: maticVars,
  80001: mumbaiVars,
  0: kovanVars, //update
  100: maticVars, //update
};

export const gasPrice = 175000000000;

export const aavegotchiDAOAddress =
  "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";
export const pixelcraftAddress = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";

export const proxyAdminAddress = "0xB549125b4A2F3c1B4319b798EcDC72b04315dF2D";

export const ecosystemVesting = "0x7e07313B4FF259743C0c84eA3d5e741D2b0d07c3";
export const gameplayVesting = "0x3fB6C2A83d2FfFe94e0b912b612fB100047cc176";

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
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};
