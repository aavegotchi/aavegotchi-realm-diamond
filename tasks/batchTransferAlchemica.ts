/* global ethers hre task */

import { BigNumber, BigNumberish, Signer } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { alchemica, gasPrice, maticDiamondAddress } from "../constants";
import { impersonate } from "../scripts/helperFunctions";
import { AlchemicaToken, RealmFacet } from "../typechain";

export interface MintParcelsTaskArgs {
  amounts: string;
  wallet: string;
}

task("batchTransferAlchemica", "batch transfers alchemica to address")
  .addParam(
    "amounts",
    "amounts of Alchemica to be released (fud, fomo, alpha, kek"
  )
  .addParam("wallet", "wallet to send to")

  .setAction(
    async (taskArgs: MintParcelsTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const amounts = taskArgs.amounts.split(",") as [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
      ];

      const accounts: Signer[] = await hre.ethers.getSigners();
      const deployer = accounts[0];

      let realmFacet = (await hre.ethers.getContractAt(
        "RealmFacet",
        maticDiamondAddress,
        deployer
      )) as RealmFacet;

      const wallet = taskArgs.wallet;

      const owner = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

      const testing = ["hardhat"].includes(hre.network.name);

      //Approve
      for (let i = 0; i < alchemica.length; i++) {
        const alc = alchemica[i];

        let token = (await hre.ethers.getContractAt(
          "AlchemicaToken",
          alc
        )) as AlchemicaToken;

        if (testing) {
          token = await impersonate(owner, token, hre.ethers, hre.network);
        }

        const allowance = await token.allowance(owner, maticDiamondAddress);
        console.log("Allowance:", hre.ethers.utils.formatEther(allowance));

        const bal = await token.balanceOf(wallet);
        console.log("Before balance:", hre.ethers.utils.formatEther(bal));
      }

      console.log("Batch transferring tokens to!", wallet);

      if (testing) {
        realmFacet = await impersonate(
          owner,
          realmFacet,
          hre.ethers,
          hre.network
        );
      }
      //transfer
      const tx = await realmFacet.batchTransferAlchemica([wallet], [amounts], {
        gasPrice: gasPrice,
      });
      await tx.wait();

      for (let i = 0; i < alchemica.length; i++) {
        const alc = alchemica[i];

        const token = (await hre.ethers.getContractAt(
          "AlchemicaToken",
          alc
        )) as AlchemicaToken;

        const bal = await token.balanceOf(wallet);
        console.log("After balance:", hre.ethers.utils.formatEther(bal));
      }
    }
  );
