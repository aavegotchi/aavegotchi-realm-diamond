import { Signer } from "@ethersproject/abstract-signer";
import { Contract } from "@ethersproject/contracts";
import { HardhatRuntimeEnvironment, Network } from "hardhat/types";
import { DiamondLoupeFacet, OwnershipFacet } from "../typechain";
import {
  mumbaiDiamondAddress,
  mumbaiInstallationDiamondAddress,
} from "./installation/helperFunctions";

export const gasPrice = 500000000000;

export async function impersonate(
  address: string,
  contract: any,
  ethers: any,
  network: Network
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
export const maticDiamondAddress = "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";
export const maticAavegotchiDiamondAddress =
  "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
export const aavegotchiDAOAddress =
  "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";
export const pixelcraftAddress = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";

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

export async function getDiamondSigner(
  ethers: any,
  network: any,
  override?: string,
  useLedger?: boolean
) {
  //Instantiate the Signer
  let signer: Signer;
  const owner = await (
    (await ethers.getContractAt(
      "OwnershipFacet",
      maticDiamondAddress
    )) as OwnershipFacet
  ).owner();
  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [override ? override : owner],
    });
    return await ethers.getSigner(override ? override : owner);
  } else if (network.name === "matic") {
    return (await ethers.getSigners())[0];
  } else {
    throw Error("Incorrect network selected");
  }
}

export function realmDiamondAddress(network: string) {
  if (["mumbai", "localhost"].includes(network)) return mumbaiDiamondAddress;
  return maticDiamondAddress;
}

export function installationDiamondAddress(network: string) {
  if (["mumbai", "localhost"].includes(network))
    return mumbaiInstallationDiamondAddress;
  return "";
}

export async function mineBlocks(ethers: any, count: number) {
  //convert to hex and handle invalid leading 0 problem
  const number = ethers.utils.hexlify(count).replace("0x0", "0x");
  await ethers.provider.send("hardhat_mine", [number]);
}
