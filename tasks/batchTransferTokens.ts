/* global ethers hre task */

import { BigNumber, BigNumberish, Signer } from "ethers";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { alchemica, gasPrice, varsForNetwork } from "../constants";
import { impersonate } from "../scripts/helperFunctions";
import { AlchemicaFacet, AlchemicaToken, RealmFacet } from "../typechain";

export interface MintParcelsTaskArgs {
  amounts: string;
  addresses: string;
  tokens: string;
}

task("batchTransferTokens", "batch transfers tokens to addresses")
  .addParam("addresses", "array of addresses to send")
  .addParam(
    "tokens",
    "two-dimensional array of tokens to be sent to each address"
  )
  .addParam(
    "amounts",
    "two-dimensional array of amounts of tokens to be sent to each address"
  )

  .setAction(
    async (taskArgs: MintParcelsTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const c = await varsForNetwork(hre.ethers);
      const maticDiamondAddress = c.realmDiamond;

      const amounts = taskArgs.amounts.split(",") as [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
      ];

      const tokens = taskArgs.amounts.split(",") as [
        string,
        string,
        string,
        string
      ];

      const addresses = taskArgs.amounts.split(",") as [
        string,
        string,
        string,
        string
      ];

      const accounts: Signer[] = await hre.ethers.getSigners();
      const deployer = accounts[0];

      let alchemicaFacet = (await hre.ethers.getContractAt(
        "AlchemicaFacet",
        maticDiamondAddress,
        deployer
      )) as AlchemicaFacet;

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

      if (testing) {
        alchemicaFacet = await impersonate(
          owner,
          alchemicaFacet,
          hre.ethers,
          hre.network
        );
      }

      console.log("Batch transferring tokens to!", addresses);

      //transfer
      const tx = await alchemicaFacet.batchTransferTokens(
        tokens,
        amounts,
        addresses,
        {
          gasPrice: gasPrice,
        }
      );
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
