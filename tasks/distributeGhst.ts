import { task } from "hardhat/config";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { gasPrice, varsForNetwork } from "../constants";
import { getRelayerSigner } from "../scripts/helperFunctions";

interface DistributionResult {
  address: string;
  amount: string;
}

task("distribute-ghst", "Distribute GHST tokens based on leaderboard results")
  .addParam("amount", "Total amount of GHST to distribute")
  .addParam("addresses", "Comma-separated list of addresses to distribute to")
  .addParam(
    "amounts",
    "Comma-separated list of amounts to distribute to each address"
  )
  .setAction(async (taskArgs, hre) => {
    try {
      // Parse addresses and amounts from parameters
      const addresses = taskArgs.addresses ? taskArgs.addresses.split(",") : [];
      const amounts = taskArgs.amounts ? taskArgs.amounts.split(",") : [];

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
        "ghst-distribution.json",
        JSON.stringify(distribution, null, 2)
      );

      console.log(`Distribution saved to ghst-distribution.json`);
      console.log(`Total addresses: ${distribution.length}`);

      // Now use batchTransferTokens functionality to send the tokens
      const c = await varsForNetwork(hre.ethers);

      const signer = await getRelayerSigner(hre);

      const signerAddress = await signer.getAddress();

      const ghstToken = await hre.ethers.getContractAt("ERC20", c.ghst, signer);

      const signerBalanceBefore = await ghstToken.balanceOf(signerAddress);

      console.log("signerBalanceBefore", signerBalanceBefore.toString());

      const newTokenDistributorAddress =
        "0x23E1dFdE8259Bdd049E055ACbc138607ECfa2b19"; // TODO: REPLACE THIS

      const batchTransferContract = await hre.ethers.getContractAt(
        "TokenDistributor", // Using contract name, requires ABI to be available via compilation
        newTokenDistributorAddress,
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

      // Check and approve GHST spending if needed
      const allowance = await ghstToken.allowance(
        signerAddress,
        newTokenDistributorAddress // Use the new contract address for allowance check
      );

      if (allowance.lt(totalNeeded)) {
        console.log("Approving GHST spending for TokenDistributor contract...");
        const approveTx = await ghstToken.approve(
          newTokenDistributorAddress, // Approve the new contract address
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
          tokens.push([c.ghst]);
          amounts.push([dist.amount]);
          addresses.push(dist.address);
        }

        //for each address, output the amount of ghst they are getting
        for (const dist of batchDistribution) {
          console.log(
            `${dist.address}: ${hre.ethers.utils.formatEther(dist.amount)} GHST`
          );
        }

        // Send the batch
        try {
          // Flatten the amounts array for the contract call
          // Ensure elements are strings representing wei, which they should be from distributeGeistGHST.ts
          const flatAmountsForCall = amounts.map((innerArray) =>
            innerArray[0].toString()
          );

          const tx = await batchTransferContract.distribute(
            c.ghst, // tokenAddress param
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
      console.error("Error distributing GHST:", String(error).slice(0, 1000));
    }
  });
