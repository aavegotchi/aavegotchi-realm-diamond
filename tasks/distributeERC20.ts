import { task } from "hardhat/config";
import { BigNumber, BigNumberish } from "ethers";
import { varsForNetwork } from "../constants";
import { getRelayerSigner } from "../scripts/helperFunctions";

interface DistributionResult {
  address: string;
  amount: string;
}

task("distribute-erc20", "Distribute ERC20 tokens based on leaderboard results")
  .addParam("amount", "Total amount of ERC20 to distribute")
  .addParam("addresses", "Comma-separated list of addresses to distribute to")
  .addParam(
    "amounts",
    "Comma-separated list of amounts to distribute to each address"
  )
  .addParam("erc20", "ERC20 token to distribute")
  .addParam("tokenName", "Name of the token to distribute")
  .addParam("tokenDecimals", "Decimals of the token to distribute")
  .addParam("tokenDistributorAddress", "Address of the token distributor")
  .setAction(async (taskArgs, hre) => {
    try {
      // Parse addresses and amounts from parameters
      const addresses = taskArgs.addresses ? taskArgs.addresses.split(",") : [];
      const amounts = taskArgs.amounts ? taskArgs.amounts.split(",") : [];
      const erc20Address = taskArgs.erc20;
      const tokenName = taskArgs.tokenName;
      const tokenDecimals = taskArgs.tokenDecimals;
      const tokenDistributorAddress = taskArgs.tokenDistributorAddress;

      console.log(addresses);
      console.log(amounts);

      // Validate input
      if (addresses.length === 0) {
        throw new Error("No addresses provided");
      }

      if (amounts.length === 0) {
        throw new Error("No amounts provided");
      }

      if (addresses.length !== amounts.length) {
        throw new Error(
          `Mismatch between addresses (${addresses.length}) and amounts (${amounts.length})`
        );
      }

      // Create distribution array
      const distribution: DistributionResult[] = [];

      for (let i = 0; i < addresses.length; i++) {
        distribution.push({
          address: addresses[i],
          amount: amounts[i],
        });
      }

      // Sort by amount in descending order
      distribution.sort((a, b) => Number(b.amount) - Number(a.amount));

      // Save distribution to file
      const fs = require("fs");
      fs.writeFileSync(
        `${tokenName}-distribution.json`,
        JSON.stringify(distribution, null, 2)
      );

      console.log(`Distribution saved to ${tokenName}-distribution.json`);
      console.log(`Total addresses: ${distribution.length}`);

      // Now use batchTransferTokens functionality to send the tokens
      const c = await varsForNetwork(hre.ethers);

      const signer = await getRelayerSigner(hre);

      const signerAddress = await signer.getAddress();

      const erc20Token = await hre.ethers.getContractAt(
        "ERC20",
        erc20Address,
        signer
      );

      const signerBalanceBefore = await erc20Token.balanceOf(signerAddress);

      console.log("signerBalanceBefore", signerBalanceBefore.toString());

      const batchTransferContract = await hre.ethers.getContractAt(
        "TokenDistributor", // Using contract name, requires ABI to be available via compilation
        tokenDistributorAddress,
        signer
      );

      // Calculate total amount needed
      const totalNeeded = distribution.reduce(
        (acc, curr) => acc.add(curr.amount),
        BigNumber.from(0)
      );

      console.log("totalNeeded", totalNeeded.toString());

      if (totalNeeded.gt(signerBalanceBefore)) {
        throw new Error("Insufficient balance");
      }

      // Check and approve ERC20 spending if needed
      const allowance = await erc20Token.allowance(
        signerAddress,
        tokenDistributorAddress // Use the new contract address for allowance check
      );

      if (allowance.lt(totalNeeded)) {
        console.log(
          `Approving ${tokenName} spending for TokenDistributor contract...`
        );
        const approveTx = await erc20Token.approve(
          tokenDistributorAddress, // Approve the new contract address
          hre.ethers.constants.MaxUint256
        );
        await approveTx.wait();
        console.log("Approval successful");
      }

      // Process in batches of 100
      const batchSize = 100;
      const totalBatches = Math.ceil(distribution.length / batchSize);

      console.log("total batches:", totalBatches);

      console.log(
        `Processing ${distribution.length} distributions in ${totalBatches} batches of ${batchSize}`
      );

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * batchSize;
        const endIndex = Math.min(startIndex + batchSize, distribution.length);
        const batchDistribution = distribution.slice(startIndex, endIndex);

        console.log(
          `Processing batch ${batchIndex + 1}/${totalBatches} (addresses ${
            startIndex + 1
          }-${endIndex})`
        );

        // Prepare the tokens and amounts arrays for this batch
        const tokens: string[][] = [];
        const amounts: BigNumberish[][] = [];
        const addresses: string[] = [];

        for (const dist of batchDistribution) {
          tokens.push([erc20Address]);
          amounts.push([dist.amount]);
          addresses.push(dist.address);
        }

        //for each address, output the amount of erc20 they are getting
        for (const dist of batchDistribution) {
          console.log(
            `${dist.address}: ${hre.ethers.utils.formatUnits(
              dist.amount,
              tokenDecimals
            )} ${tokenName}`
          );
        }

        // Send the batch
        try {
          // Flatten the amounts array for the contract call
          // Ensure elements are strings representing wei, which they should be from distributeGeistERC20.ts
          const flatAmountsForCall = amounts.map((innerArray) =>
            innerArray[0].toString()
          );

          const tx = await batchTransferContract.distribute(
            erc20Address, // tokenAddress param
            addresses, // recipients param
            flatAmountsForCall // amounts param
          );

          console.log(`Transaction sent: ${tx.hash}`);
          await tx.wait(); // Wait for transaction to be mined

          console.log(`Successfully processed batch ${batchIndex + 1}`);
        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error);

          throw error;
        }
      }

      console.log("All distributions completed");
    } catch (error) {
      console.error(`Error running script:`, String(error).slice(0, 1000));
    }
  });
