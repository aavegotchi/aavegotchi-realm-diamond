/* global ethers hre task */

import { BigNumber, Signer } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { alchemica, gameplayVesting } from "../scripts/helperFunctions";
import { AlchemicaToken, AlchemicaVesting } from "../typechain";
import { NonceManager } from "@ethersproject/experimental";

export interface MintParcelsTaskArgs {
  amounts: string;
}

task(
  "releaseGameplay",
  "Releases funds from gameplay vesting contract to beneficiary"
)
  .addParam(
    "amounts",
    "amounts of Alchemica to be released (fud, fomo, alpha, kek"
  )

  .setAction(
    async (taskArgs: MintParcelsTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const amounts = taskArgs.amounts.split(",");

      console.log("amounts:", amounts);

      const accounts: Signer[] = await hre.ethers.getSigners();
      const deployer = accounts[0];

      const manager = new NonceManager(deployer);

      let ecosystemVestingContract = (await hre.ethers.getContractAt(
        "AlchemicaVesting",
        gameplayVesting,
        manager
      )) as AlchemicaVesting;

      const beneficiary = await ecosystemVestingContract.beneficiary();
      console.log("beneficiary is:", beneficiary);

      for (let i = 0; i < alchemica.length; i++) {
        const element = alchemica[i];

        let releasableamount = await ecosystemVestingContract.releasableAmount(
          element
        );

        if (BigNumber.from(amounts[i]).eq(0)) {
          console.log("skip:", element);
          continue;
        }

        console.log(
          "amount before:",
          hre.ethers.utils.formatEther(releasableamount)
        );
        const tx = await ecosystemVestingContract.partialRelease(
          element,
          amounts[i]
        );
        await tx.wait();

        releasableamount = await ecosystemVestingContract.releasableAmount(
          element
        );
        console.log(
          "amount after:",
          hre.ethers.utils.formatEther(releasableamount)
        );

        console.log("element:", element);

        const token = (await hre.ethers.getContractAt(
          "AlchemicaToken",
          element
        )) as AlchemicaToken;
        const bal = await token.balanceOf(beneficiary);
        console.log(
          "beneficiary balance is now:",
          hre.ethers.utils.formatEther(bal)
        );
      }
    }
  );
