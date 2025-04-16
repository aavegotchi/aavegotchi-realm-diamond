import { task } from "hardhat/config";
import { BigNumber } from "ethers";
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

      // Log top 10 recipients
      console.log("\nTop 10 recipients:");
      distribution.slice(0, 10).forEach((entry, index) => {
        console.log(
          `${index + 1}. ${entry.address}: ${
            entry.amount
          } GHST percentage total: ${
            (Number(entry.amount) /
              distribution.reduce(
                (sum, item) => sum + Number(item.amount),
                0
              )) *
            100
          }%`
        );
      });

      // Now use batchTransferTokens functionality to send the tokens
      const c = await varsForNetwork(hre.ethers);

      // const [signer] = await hre.ethers.getSigners();

      const signer = await getRelayerSigner(hre);

      const signerAddress = await signer.getAddress();

      const alchemicaFacet = await hre.ethers.getContractAt(
        "AlchemicaFacet",
        c.realmDiamond,
        signer
      );

      const ghstToken = await hre.ethers.getContractAt("ERC20", c.ghst, signer);

      // Calculate total amount needed
      const totalNeeded = distribution.reduce(
        (acc, curr) => acc.add(hre.ethers.utils.parseEther(curr.amount)),
        BigNumber.from(0)
      );

      // Check and approve GHST spending if needed
      const allowance = await ghstToken.allowance(
        signerAddress,
        c.realmDiamond
      );
      if (allowance.lt(totalNeeded)) {
        console.log("Approving GHST spending...");
        const approveTx = await ghstToken.approve(
          c.realmDiamond,
          hre.ethers.constants.MaxUint256,
          { gasPrice }
        );
        await approveTx.wait();
        console.log("Approval successful");
      }

      // Process in batches of 100
      const batchSize = 100;
      const totalBatches = Math.ceil(distribution.length / batchSize);

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
        const amounts: string[][] = [];
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

        console.log("Sending batch..., example of 10 below:");
        console.log(tokens.slice(0, 10));
        console.log(amounts.slice(0, 10));
        console.log(addresses.slice(0, 10));

        // Send the batch
        try {
          const tx = await alchemicaFacet.batchTransferTokens(
            tokens,
            amounts,
            addresses,
            { gasPrice }
          );

          console.log(`Transaction sent: ${tx.hash}`);
          await tx.wait();
          console.log(`Successfully processed batch ${batchIndex + 1}`);
        } catch (error) {
          console.error(`Error processing batch ${batchIndex + 1}:`, error);
        }
      }

      console.log("All distributions completed");
    } catch (error) {
      console.error("Error distributing GHST:", error.slice(0, 1000));
    }
  });
