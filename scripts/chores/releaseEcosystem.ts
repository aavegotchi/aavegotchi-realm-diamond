import { Signer } from "ethers";
import { ethers, network } from "hardhat";

import { RealmFacet } from "../typechain";
import {
  ecosystemVesting,
  ecosystemVesting,
  gameplayVesting,
} from "../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  let ecosystemVestingContract = (await ethers.getContractAt(
    "AlchemicaVesting",
    ecosystemVesting,
    deployer
  )) as RealmFacet;

  const mauvis = "0x619dfbec3273ceeef52839d78069294ce1c4ce7b";

  //   realmFacet = await impersonate(mauvis, realmFacet, ethers, network);

  const amounts = [
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
  ];
  await realmFacet.batchTransferTokensToGotchis(
    [20284],
    [
      "0x660dA6FC1D04F9eCFcbe475418325137a1fD3042", //fake fud
      "0x077Ab14B3b355a052670a9ec12677B155AA12D05", //fake fomo
      "0x97c1e625D0B1CEB2C0D09e5F1b2A4b296C8Ec6ea", //fake alpha
      "0xF3D31c7CF172c622b2140D4424cFdE20751407d9", //fake kek
    ],
    [amounts]
  );
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
