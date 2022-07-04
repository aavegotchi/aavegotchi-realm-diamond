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
};

const maticVars: Constants = {
  aavegotchiDiamond: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  realmDiamond: "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11",
  installationDiamond: "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A",
  tileDiamond: "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355",
  fud: "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
  fomo: "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
  alpha: "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
  kek: "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
  gltr: "",
};

const mumbaiVars: Constants = {
  aavegotchiDiamond: "",
  realmDiamond: "0x7F2331C4F9e4E8b5A0fF0b1ecBd9D926371ffC45",
  installationDiamond: "0x4638B8127D1FC1bb69732c8D82Ea0Ab487A79e23",
  tileDiamond: "",
  fud: "",
  fomo: "",
  alpha: "",
  kek: "",
  gltr: "",
};

const networkToVars: NetworkToConstants = {
  137: maticVars,
  80001: mumbaiVars,
  0: kovanVars, //update
  100: maticVars, //update
};

export const gasPrice = 75000000000;

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
