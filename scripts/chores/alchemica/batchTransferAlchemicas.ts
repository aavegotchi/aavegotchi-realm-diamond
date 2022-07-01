import { BigNumber, BigNumberish, Signer } from "ethers";
import { ethers, network } from "hardhat";
import { alchemica, varsForNetwork } from "../../../constants";

import { AlchemicaToken, RealmFacet } from "../../../typechain";

// import { upgrade } from "../scripts/upgrades/upgrade-fixDiamond";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const c = await varsForNetwork(ethers);
  const maticDiamondAddress = c.realmDiamond;

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    c.realmDiamond,
    deployer
  )) as RealmFacet;

  //prod hot wallet
  const wallet = "0x2C1a288353e136b9E4b467AADb307133ffFeaB25";

  const amounts: [BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("10"),
  ];

  const owner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  //Approve
  for (let i = 0; i < alchemica.length; i++) {
    const alc = alchemica[i];

    let token = (await ethers.getContractAt(
      "AlchemicaToken",
      alc
    )) as AlchemicaToken;

    // token = await impersonate(owner, token, ethers, network);

    const tx = await token.approve(
      c.realmDiamond,
      ethers.utils.parseEther("10000000000")
    );
    await tx.wait();

    const allowance = await token.allowance(owner, maticDiamondAddress);
    console.log("Allowance:", ethers.utils.formatEther(allowance));

    const bal = await token.balanceOf(wallet);
    console.log("Before balance:", ethers.utils.formatEther(bal));
  }

  console.log("Batch transferring!");
  //transfer
  await realmFacet.batchTransferAlchemica([wallet], [amounts]);

  for (let i = 0; i < alchemica.length; i++) {
    const alc = alchemica[i];

    const token = (await ethers.getContractAt(
      "AlchemicaToken",
      alc
    )) as AlchemicaToken;

    await token.approve(
      maticDiamondAddress,
      ethers.utils.parseEther("10000000000")
    );

    const bal = await token.balanceOf(wallet);
    console.log("After balance:", ethers.utils.formatEther(bal));
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
