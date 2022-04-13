import * as hre from "hardhat";

import {
  deployProxyAdmin,
  verify,
  deployVestingContracts,
  deployAlchemica,
} from "../../helpers/helpers";
import { VerifyParams } from "../../helpers/types";
import { address } from "../../helpers/utils";
import { REALM_DIAMOND } from "../../helpers/constants";

async function main() {
  let verifyParams: VerifyParams[] = [];
  const signers = await hre.ethers.getSigners();
  const owner = signers[0];
  console.log("Owner: ", await address(owner));
  const proxyAdmin = await deployProxyAdmin(owner);
  console.log("ProxyAdmin: ", proxyAdmin.contract.address);
  verifyParams.push(proxyAdmin);

  const myRealmDiamond = "0x6bb645178AEd185980e9a9BAB92aA96eB405D7A4";

  let [vestingImplementation, ecosystemVesting, gameplayVesting] =
    await deployVestingContracts(owner, proxyAdmin.contract);
  verifyParams.push(vestingImplementation, ecosystemVesting, gameplayVesting);

  let [alchemicaImplementation, fud, fomo, alpha, kek] = await deployAlchemica(
    owner,
    proxyAdmin.contract,
    myRealmDiamond,
    gameplayVesting.contract,
    ecosystemVesting.contract
  );
  verifyParams.push(alchemicaImplementation, fud, fomo, alpha, kek);

  if (process.env.VERIFY) {
    await verify(verifyParams);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
