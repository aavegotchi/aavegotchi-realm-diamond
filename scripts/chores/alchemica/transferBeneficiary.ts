import { BigNumberish, Signer } from "ethers";
import { ethers, network } from "hardhat";

import { AlchemicaVesting } from "../../../typechain";
import { gameplayVesting, impersonate } from "../../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();
  const deployer = accounts[0];

  const currentBeneficiary = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  const newBeneficiary = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119"; //itemManager

  let alchemicaVesting = (await (
    await ethers.getContractAt("AlchemicaVesting", gameplayVesting)
  ).connect(deployer)) as AlchemicaVesting;

  const testing = ["hardhat"].includes(network.name);

  if (testing) {
    alchemicaVesting = await impersonate(
      currentBeneficiary,
      alchemicaVesting,
      ethers,
      network
    );
  }

  const tx = await alchemicaVesting.replaceBeneficiary(newBeneficiary);
  await tx.wait();

  const owner = await alchemicaVesting.owner();
  const newBenef = await alchemicaVesting.beneficiary();
  console.log("owner:", owner);
  console.log("benef:", newBenef);
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
