import { Signer } from "@ethersproject/abstract-signer";
import { Contract } from "@ethersproject/contracts";
import {
  DiamondLoupeFacet,
  OwnershipFacet,
  AlchemicaToken,
} from "../../typechain";
import { network } from "hardhat";

export const gasPrice = 100000000000;

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
  "0xb012732d259df648B8B3876b9794Fcb631262447";

export const maticRealmDiamondAddress =
  "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11";

export const maticAavegotchiDiamondAddress =
  "0x86935f11c86623dec8a25696e1c19a8659cbf95d";

export const mumbaiInstallationDiamondAddress =
  "0x4638B8127D1FC1bb69732c8D82Ea0Ab487A79e23";

export const maticInstallationDiamondAddress =
  "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";

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

export async function approveRealAlchemica(
  address: string,
  installationAddress: string,
  ethers: any
) {
  const alchemica = [
    "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
    "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
    "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
    "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
  ];

  for (let i = 0; i < alchemica.length; i++) {
    const alchemicaToken = alchemica[i];
    let token = (await ethers.getContractAt(
      "AlchemicaToken",
      alchemicaToken
    )) as AlchemicaToken;
    token = await impersonate(address, token, ethers, network);
    await token.approve(
      installationAddress,
      ethers.utils.parseUnits("1000000000")
    );
  }
}

export async function faucetRealAlchemica(receiver: string, ethers: any) {
  const alchemica = [
    "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f",
    "0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8",
    "0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2",
    "0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C",
  ];

  for (let i = 0; i < alchemica.length; i++) {
    const alchemicaToken = alchemica[i];
    let token = (await ethers.getContractAt(
      "AlchemicaToken",
      alchemicaToken
    )) as AlchemicaToken;
    token = await impersonate(await token.owner(), token, ethers, network);
    await token.mint(receiver, ethers.utils.parseEther("10000"));
  }
}
