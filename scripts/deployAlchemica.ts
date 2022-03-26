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
  verify,
  deployVestingContracts,
  deployAlchemica,
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

async function main() {
  let verifyParams: VerifyParams[] = [];
  const signers = await hre.ethers.getSigners();
  const owner = signers[0];
  console.log("Owner: ", await address(owner));
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
