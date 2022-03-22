import * as hre from "hardhat";
import { ethers } from "hardhat";
import {
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import { 
  BigNumber, 
  Signer, 
  Contract, 
  ContractFactory,
  Wallet,
  BytesLike,
  utils,
  Signature,
} 
  from "ethers";


import {
  ETHER,
  GWEI,
  WMATIC_ADDRESS,
  PERMIT_TYPES,
} from "./constants";

import {
  VerifyParams,
  Domain,
} from "./types";

import {
  increaseTime,
  mine,
  currentTimestamp,
  address,
  sleep,
} from "./utils";

export async function createDomain(
  token: Contract,
): Promise<Domain> {
  const domain = {
    name: await token.name(),
    version: '1',
    chainId: 137,
    verifyingContract: token.address,
  };
  return domain;
}

export async function permit(
  hre: HardhatRuntimeEnvironment,
  token: Contract,
  owner: Wallet,
  spender: string,
  value: BigNumber,
  nonce: BigNumber,
  deadline: BigNumber,
) {
    const sig = await permitRSV(
      hre,
      owner,
      spender,
      value,
      nonce,
      deadline,
      await createDomain(token),
    );
    return await token.connect(owner).permit(
      await address(owner),
      spender,
      value,
      deadline,
      sig.v,
      sig.r,
      sig.s,
    )
}

export async function permitRSV(
  hre: HardhatRuntimeEnvironment,
  owner: Wallet,
  spender: string,
  value: BigNumber,
  nonce: BigNumber,
  deadline: BigNumber,
  domain: Domain,
) {
  const message = {
    owner: await address(owner),
    spender: spender,
    value: value,
    nonce: nonce,
    deadline: deadline,
  }

  const result = await owner._signTypedData(
    domain,
    PERMIT_TYPES,
    message,
  );  
  let sig: Signature = ethers.utils.splitSignature(result);

  return sig;
};

export async function deployProxyAdmin(
  owner: Signer,
) : Promise<VerifyParams> {
  let ProxyAdmin = await hre.ethers.getContractFactory("ProxyAdmin");
  let proxyAdmin =  await ProxyAdmin.connect(owner).deploy();
  await proxyAdmin.deployed();
  return {contract: proxyAdmin, constructorArgs: []};
}

export async function deployProxy(
  logic: Contract,
  admin: Signer | Contract,
) : Promise<VerifyParams> {
  let Proxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  let proxy =  await Proxy.deploy(await address(logic), await address(admin), []);
  await proxy.deployed();
  return {contract: proxy, constructorArgs: [await address(logic), await address(admin), []]};
}

export async function getProxyContract(
  contract: Contract,
) : Promise<Contract> {
  let Proxy = await hre.ethers.getContractFactory("TransparentUpgradeableProxy");
  return await Proxy.attach(contract.address);
}


export async function deployAndInitializeVestingProxy(
  owner: Signer,
  implementation: Contract,
  beneficiary: string,
  proxyAdmin: Signer | Contract = owner,
  start: BigNumber = BigNumber.from('0'),
  decayFactor: BigNumber = ETHER.mul(20).div(100),
  revocable: boolean = true,
): Promise<VerifyParams> {
  let proxyVerify = await deployProxy(implementation, proxyAdmin);
  let proxy = proxyVerify.contract;
  let alchemicaVesting = await implementation.attach(proxy.address);
  let tx = await alchemicaVesting.connect(owner).initialize(
    beneficiary,
    start,
    decayFactor,
    revocable,
    {gasLimit: 1000000}
  );
  await tx.wait();
  return {contract: alchemicaVesting, constructorArgs: proxyVerify.constructorArgs};
}

export async function deployVestingImplementation(
  owner: Signer,
): Promise<VerifyParams> {
  let AlchemicaVesting = await hre.ethers.getContractFactory("AlchemicaVesting");
  let implementation = await AlchemicaVesting.connect(owner).deploy();
  await implementation.deployed();
  return {contract: implementation, constructorArgs: []};
}


export async function deployAlchemicaImplementation(
  owner: Signer,
): Promise<VerifyParams> {
  let AlchemicaToken = await hre.ethers.getContractFactory("AlchemicaToken");
  let implementation = await AlchemicaToken.connect(owner).deploy();
  await implementation.deployed();
  return {contract: implementation, constructorArgs: []};
}

export async function deployAndInitializeAlchemicaProxy(
  owner: Signer,
  implementation: Contract,
  proxyAdmin: Contract,
  name: string,
  symbol: string,
  supply: BigNumber,
  realmDiamond: string,
  ecosystemVestingContract: Contract | Signer,
  gameplayVestingContract: Contract | Signer,
): Promise<VerifyParams> {
  let proxy = await deployProxy(implementation, proxyAdmin);
  let alchemicaToken = implementation.attach(await address(proxy.contract));
  let tx = await alchemicaToken.connect(owner).initialize(
    name,
    symbol,
    supply,
    realmDiamond,
    await address(ecosystemVestingContract),
    await address(gameplayVestingContract),
    {gasLimit: 10000000},
  );
  await tx.wait();
  return {contract: alchemicaToken, constructorArgs: proxy.constructorArgs};
}

export async function deployGAXFactory(
  owner: Signer,
): Promise<VerifyParams> {
  let contractFactory = await hre.ethers.getContractFactory("UniswapV2Factory");
  let contract = await contractFactory.deploy(await address(owner));
  return {contract: contract, constructorArgs: [await address(owner)]};
}

export async function deployGAXRouter(
  owner: Signer,
  factory: Contract,
): Promise<VerifyParams> {
  let contractFactory = await hre.ethers.getContractFactory("UniswapV2Router01");
  let contract = await contractFactory.deploy(await address(factory), WMATIC_ADDRESS);
  return {contract: contract, constructorArgs: [await address(factory), WMATIC_ADDRESS]};
}

export async function verify(verifyParams: VerifyParams[]): Promise<void> {
  console.log("Sleeping for 2 minutes to let contracts be mined before verification.");
  await sleep(120000);
  for(let p of verifyParams) {
    console.log("Verifying " + p.contract.address + ":");
    try{
      await hre.run("verify:verify", 
      {
        address: p.contract.address,
        constructorArguments: p.constructorArgs,
      });
    } catch(e) {
      console.log("Contract verification failed." )
      console.log(e);
    }
  }
}
