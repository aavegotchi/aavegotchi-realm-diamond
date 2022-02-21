import * as hre from "hardhat";
import { ethers } from "hardhat";
import { 
  BigNumber, 
  Signer, 
  Contract, 
  ContractFactory } from "ethers";

export async function deployVestingContract(
  owner: Signer,
  beneficiary: Signer,
  start: BigNumber,
  decayFactor: BigNumber,
  revocable: boolean,
): Promise<Contract> {
  let contractFactory = await hre.ethers.getContractFactory("AlchemicaVesting");
  let contract = await contractFactory.connect(owner).deploy(
    await beneficiary.getAddress(),
    start,
    decayFactor,
    revocable,
  );
  await contract.deployed();
  return contract;
}

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