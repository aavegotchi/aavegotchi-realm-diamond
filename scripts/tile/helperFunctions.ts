import { Contract } from "@ethersproject/contracts";
import { DiamondLoupeFacet } from "../../typechain-types";

export const gasPrice = 900000000000;

export async function impersonate(
  address: string,
  contract: any,
  ethers: any,
  network: any
) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
  let signer = await ethers.getSigner(address);
  contract = contract.connect(signer);
  return contract;
}

export async function resetChain(hre: any) {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.MATIC_URL,
        },
      },
    ],
  });
}

export function getSelectors(contract: Contract) {
  const signatures = Object.keys(contract.interface.functions);
  const selectors = signatures.reduce((acc: string[], val: string) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }
    return acc;
  }, []);
  return selectors;
}

export function getSighashes(selectors: string[], ethers: any): string[] {
  if (selectors.length === 0) return [];
  const sighashes: string[] = [];
  selectors.forEach((selector) => {
    if (selector !== "") sighashes.push(getSelector(selector, ethers));
  });
  return sighashes;
}

export function getSelector(func: string, ethers: any) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

export const kovanDiamondAddress = "0xa37D0c085121B6b7190A34514Ca28fC15Bb4dc22";
export const maticDiamondAddress = "";
export const mumbaiDiamondAddress =
  "0x1B84ADcD1DC7F2890D6e4889232cc349b3517F92";

export const maticRealmDiamondAddress =
  "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11";
export const maticInstallationDiamondAddress =
  "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";
export const maticTileDiamondAddress =
  "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";

export const maticAavegotchiDiamondAddress =
  "0x86935f11c86623dec8a25696e1c19a8659cbf95d";

export const maticGhstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
export async function diamondOwner(address: string, ethers: any) {
  return await (await ethers.getContractAt("OwnershipFacet", address)).owner();
}

export async function getFunctionsForFacet(facetAddress: string, ethers: any) {
  const Loupe = (await ethers.getContractAt(
    "DiamondLoupeFacet",
    maticDiamondAddress
  )) as DiamondLoupeFacet;
  const functions = await Loupe.facetFunctionSelectors(facetAddress);
  return functions;
}
