import { ethers } from "hardhat";
import { varsForNetwork } from "../constants";
import { BigNumber } from "ethers";
import { gasPrice } from "../constants";

/**
 * This script sends GHST tokens to addresses in batches of 100
 * using the batchTransferTokens function from AlchemicaFacet
 */
async function main() {
  // Get the network variables
  const c = await varsForNetwork(ethers);

  // GHST token address
  const ghstAddress = c.ghst;

  // List of addresses to send GHST to
  // Replace with your actual list of addresses
  const allAddresses = [
    // Add your addresses here
    "0x1234567890123456789012345678901234567890",
    "0x0987654321098765432109876543210987654321",
    // ... more addresses
  ];

  // Amount of GHST to send to each address (in wei)
  const amountPerAddress = ethers.utils.parseEther("1.0"); // 1 GHST per address

  // Process addresses in batches of 100
  const batchSize = 100;
  const totalBatches = Math.ceil(allAddresses.length / batchSize);

  console.log(
    `Processing ${allAddresses.length} addresses in ${totalBatches} batches of ${batchSize}`
  );

  // Get the AlchemicaFacet contract
  const alchemicaFacet = await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond
  );

  // Get the GHST token contract
  const ghstToken = await ethers.getContractAt("ERC20", ghstAddress);

  // Check and approve GHST spending if needed
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();

  const allowance = await ghstToken.allowance(signerAddress, c.realmDiamond);
  if (allowance.lt(amountPerAddress.mul(allAddresses.length))) {
    console.log("Approving GHST spending...");
    const approveTx = await ghstToken.approve(
      c.realmDiamond,
      ethers.constants.MaxUint256,
      { gasPrice }
    );
    await approveTx.wait();
    console.log("Approval successful");
  }

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIndex = batchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, allAddresses.length);
    const batchAddresses = allAddresses.slice(startIndex, endIndex);

    console.log(
      `Processing batch ${batchIndex + 1}/${totalBatches} (addresses ${
        startIndex + 1
      }-${endIndex})`
    );

    // Prepare the tokens and amounts arrays for this batch
    const tokens: string[][] = [];
    const amounts: BigNumber[][] = [];

    for (let i = 0; i < batchAddresses.length; i++) {
      tokens.push([ghstAddress]);
      amounts.push([amountPerAddress]);
    }

    // Call the batchTransferTokens function directly
    try {
      const tx = await alchemicaFacet.batchTransferTokens(
        tokens,
        amounts,
        batchAddresses,
        { gasPrice }
      );

      console.log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`Successfully processed batch ${batchIndex + 1}`);
    } catch (error) {
      console.error(`Error processing batch ${batchIndex + 1}:`, error);
    }
  }

  console.log("All batches processed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
