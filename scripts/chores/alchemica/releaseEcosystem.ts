import { Signer } from "ethers";
import { ethers, network } from "hardhat";

import { alchemica, ecosystemVesting } from "../../helperFunctions";
import { AlchemicaVesting } from "../../../typechain/AlchemicaVesting";
import { AlchemicaToken } from "../../../typechain";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  let ecosystemVestingContract = (await ethers.getContractAt(
    "AlchemicaVesting",
    ecosystemVesting,
    deployer
  )) as AlchemicaVesting;

  const amountToRelease = [
    ethers.utils.parseEther("1519810"),
    ethers.utils.parseEther("777463"),
    ethers.utils.parseEther("113252"),
    ethers.utils.parseEther("31035"),
  ];

  const beneficiary = await ecosystemVestingContract.beneficiary();
  console.log("beneficiary is:", beneficiary);

  for (let i = 0; i < alchemica.length; i++) {
    const element = alchemica[i];

    let releasableamount = await ecosystemVestingContract.releasableAmount(
      element
    );
    console.log("amount before:", ethers.utils.formatEther(releasableamount));
    const tx = await ecosystemVestingContract.partialRelease(
      element,
      amountToRelease[i]
    );
    await tx.wait();

    releasableamount = await ecosystemVestingContract.releasableAmount(element);
    console.log("amount after:", ethers.utils.formatEther(releasableamount));

    const token = (await ethers.getContractAt(
      "AlchemicaToken",
      element
    )) as AlchemicaToken;
    const bal = await token.balanceOf(beneficiary);
    console.log("Beneficiary balance is now:", ethers.utils.formatEther(bal));
  }
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
