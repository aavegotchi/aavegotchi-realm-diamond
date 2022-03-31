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

  const mauvis = "0x619dfbec3273ceeef52839d78069294ce1c4ce7b";

  realmFacet = await impersonate(mauvis, realmFacet, ethers, network);
  const fakeFud = "0x660da6fc1d04f9ecfcbe475418325137a1fd3042";
  const fakeFomo = "";
  const fakeAlpha = "";
  const fakeKek = "";

  // await upgrade();

  const amounts = [
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
  ];
  await realmFacet.batchTransferTokensToGotchis(
    [20284],
    [
      "0x660dA6FC1D04F9eCFcbe475418325137a1fD3042",
      "0x077Ab14B3b355a052670a9ec12677B155AA12D05",
      "0x97c1e625D0B1CEB2C0D09e5F1b2A4b296C8Ec6ea",
      "0xF3D31c7CF172c622b2140D4424cFdE20751407d9",
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
