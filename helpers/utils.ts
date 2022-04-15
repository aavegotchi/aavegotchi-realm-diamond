import * as hre from "hardhat";
import { ethers } from "hardhat";
import { 
  BigNumber, 
  Signer, 
  Contract, 
  ContractFactory,} 
  from "ethers";

export async function increaseTime(time: number): Promise<void> {
  await hre.network.provider.send("evm_setNextBlockTimestamp", [await currentTimestamp() + time]);
}

export async function mine(times: number = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    await hre.network.provider.send("evm_mine", []);
  }
}

export async function currentTimestamp(): Promise<number> {
  let block = await hre.ethers.provider.getBlock("latest");
  return block.timestamp;
}

export async function address(
  contractOrSigner: Contract | Signer,
) : Promise<string> {
  if (contractOrSigner instanceof Contract) {
    return contractOrSigner.address;
  } 
  else {
    return await contractOrSigner.getAddress();
  }
}

export function aboutEquals(
  a: BigNumber,
  b: BigNumber,
  devianceFactor: number = 100, // Reciprocal of the accuracy (default 1%)
): boolean {
  if (a.lt(b)) {
    return a.sub(b).abs().lt(a.div(devianceFactor));
  } else {
    return b.sub(a).abs().lt(b.div(devianceFactor));
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}