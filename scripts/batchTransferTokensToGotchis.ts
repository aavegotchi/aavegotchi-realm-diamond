import { BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";

import { RealmFacet } from "../typechain";
import { impersonate, maticDiamondAddress } from "./helperFunctions";
import { upgrade } from "../scripts/upgrades/upgrade-fixDiamond";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticDiamondAddress,
    deployer
  )) as RealmFacet;

  await upgrade();

  const mauvis = "0x619dfbec3273ceeef52839d78069294ce1c4ce7b";

  realmFacet = await impersonate(mauvis, realmFacet, ethers, network);
  const fakeFud = "0x660da6fc1d04f9ecfcbe475418325137a1fd3042";
  const amounts = [ethers.utils.parseEther("10")];

  await realmFacet.batchTransferTokensToGotchis([20284], [fakeFud], [amounts]);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
