import * as hre from 'hardhat';
import {ethers} from 'hardhat';
import { 
  BigNumber,
  Signer,
  Contract,
  Wallet,
} from 'ethers';
import {
  deployProxyAdmin, 
  deployVestingImplementation, 
  deployAndInitializeVestingProxy, 
  deployAlchemicaImplementation,
  deployAndInitializeAlchemicaProxy,
  verify
} from "../helpers/helpers";
import {VerifyParams} from "../helpers/types";
import {sleep, address, currentTimestamp} from "../helpers/utils";
import {
  FUD_PARAMS,
  FOMO_PARAMS,
  ALPHA_PARAMS,
  KEK_PARAMS,
  REALM_DIAMOND,
  ETHER,
  QUICKSWAP_ROUTER_ADDRESS,
  GHST_ADDRESS,
  INITIAL_ALCHEMICA_SEED,
} from "../helpers/constants";
import {
  IERC20,
  IUniswapV2Router02,
  AlchemicaToken,
  AlchemicaVesting,
} from "../typechain/";


async function deployVestingContracts(
  owner: Signer,
  proxyAdmin: Contract,
) {
  let returnParams: VerifyParams[] = [];
  let vestingImplementation = await deployVestingImplementation(owner);
  await sleep(10000);
  console.log("Vesting Implementation: " + vestingImplementation.contract.address)
  returnParams.push(vestingImplementation);
  await vestingImplementation.contract.deployed();

  let ecosystemVestingProxy = await deployAndInitializeVestingProxy(
    owner,
    vestingImplementation.contract,
    await address(owner),
    proxyAdmin,
    BigNumber.from(await currentTimestamp() - 10000),
    ETHER.div(10), // 10% decay per year
    true,
  );
  console.log("Ecosystem Vesting: " + ecosystemVestingProxy.contract.address);
  returnParams.push(ecosystemVestingProxy);
  let gameplayVestingProxy = await deployAndInitializeVestingProxy(
    owner,
    vestingImplementation.contract,
    await address(owner),
    proxyAdmin,
    BigNumber.from(await currentTimestamp() - 10000),
    ETHER.div(10), // 10% decay per year
    true,
  )
  console.log("Gameplay Vesting: " + gameplayVestingProxy.contract.address);
  returnParams.push(gameplayVestingProxy);
  return returnParams;
}

async function deployAlchemica(
  owner: Signer,
  proxyAdmin: Contract,
  realmDiamond: string,
  gameplayVestingContract: Contract,
  ecosystemVestingContract: Contract,
) {
  let returnParams: VerifyParams[] = [];
  let alchemicaImplementation = await deployAlchemicaImplementation(owner);
  await sleep(10000);
  console.log("Alchemica Implementation: " + alchemicaImplementation.contract.address);
  returnParams.push(alchemicaImplementation);
  await alchemicaImplementation.contract.deployed();

  for(let params of [FUD_PARAMS, FOMO_PARAMS, ALPHA_PARAMS, KEK_PARAMS]) {
    let alchemicaProxy = await deployAndInitializeAlchemicaProxy(
      owner,
      alchemicaImplementation.contract,
      proxyAdmin,
      params.name,
      params.symbol,
      params.supply,
      realmDiamond,
      gameplayVestingContract,
      ecosystemVestingContract,

    );
    console.log(params.name + ": " + alchemicaProxy.contract.address);
    returnParams.push(alchemicaProxy);
  }

  return returnParams;
}

async function releaseAndLP(
  beneficiary: Signer,
  vestingContract: AlchemicaVesting,
  alchemicas: [AlchemicaToken, AlchemicaToken, AlchemicaToken, AlchemicaToken],) 
{
  const alchIn = INITIAL_ALCHEMICA_SEED[0];
  const ghstIn = INITIAL_ALCHEMICA_SEED[1];
  const names = ["FUD", "FOMO", "ALPHA", "KEK"];
  const router: IUniswapV2Router02 = (await hre.ethers.getContractAt("IUniswapV2Router02", QUICKSWAP_ROUTER_ADDRESS)) as IUniswapV2Router02;
  const ghst = await hre.ethers.getContractAt("contracts/interfaces/IERC20.sol:IERC20", GHST_ADDRESS);
  let tx = await vestingContract.connect(beneficiary).batchRelease(
    [
      await address(alchemicas[0]),
      await address(alchemicas[1]),
      await address(alchemicas[2]),
      await address(alchemicas[3]),
    ],
  );
  await tx.wait();
  tx = await ghst.connect(beneficiary).approve(
    await address(router),
    ghstIn[0].add(ghstIn[1]).add(ghstIn[2]).add(ghstIn[3]),
  );
  await tx.wait();
  console.log("GHST approved");
  for(let i = 0; i < alchemicas.length; i++) {
    let alchemica = alchemicas[i];
    console.log(
      (await alchemica.balanceOf(await address(beneficiary))).toString() + 
      " " +  names[i] + " received."
    );
    tx = await alchemica.connect(beneficiary).approve(await address(router), alchIn[i]);
    await tx.wait();
    console.log(names[i] + " approved");

    await sleep(10000);
    tx = await router.connect(beneficiary).addLiquidity(
      await address(alchemica),
      GHST_ADDRESS,
      alchIn[i],
      ghstIn[i],
      0,
      0,
      await address(beneficiary),
      await currentTimestamp() + 1000,
    );
    await tx.wait();
    console.log(
      alchIn[i].toString() + 
      " " + names[i] + " (wei) added to liquidity pool with " + 
      ghstIn[i].toString() + " GHST (wei)");
  }
}

async function main() {
  let verifyParams: VerifyParams[] = [];
  const signers = await hre.ethers.getSigners();
  const owner = signers[0];
  console.log(await address(owner));
  const proxyAdmin = await deployProxyAdmin(owner);
  console.log("ProxyAdmin: ", proxyAdmin.contract.address);
  verifyParams.push(proxyAdmin);

  let [vestingImplementation, ecosystemVesting, gameplayVesting] = await deployVestingContracts(owner, proxyAdmin.contract);
  verifyParams.push(vestingImplementation, ecosystemVesting, gameplayVesting);
  
  let [alchemicaImplementation, fud, fomo, alpha, kek] = await deployAlchemica(
    owner, 
    proxyAdmin.contract, 
    REALM_DIAMOND, 
    gameplayVesting.contract, 
    ecosystemVesting.contract
  );
  verifyParams.push(alchemicaImplementation, fud, fomo, alpha, kek);

  if(process.env.VERIFY) {
    await verify(verifyParams);
  }
  const ghst = await hre.ethers.getContractAt("contracts/interfaces/IERC20.sol:IERC20", GHST_ADDRESS);
  const ownerBalance = await ghst.balanceOf(await address(owner));

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
