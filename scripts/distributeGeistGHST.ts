import { run } from "hardhat";
import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import balancesData from "./geist-ghst-balances-final.json";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { varsForNetwork } from "../constants";

async function checkBalanceExistence(addresses: string[]) {
  // --- BEGIN ADDRESS EXISTENCE CHECK ---
  const ADDRESS_CHECK_OUTPUT_FILE = "address-existence-checks.json";
  if (addresses.length > 0) {
    console.log(
      `\nChecking recipient addresses on the configured network (e.g., Base). Results will be saved to ${ADDRESS_CHECK_OUTPUT_FILE}...`
    );
    // Initialize the JSON file with an empty array
    try {
      fs.writeFileSync(ADDRESS_CHECK_OUTPUT_FILE, JSON.stringify([], null, 2));
    } catch (initError) {
      console.error(
        `Error initializing ${ADDRESS_CHECK_OUTPUT_FILE}:`,
        initError
      );
      // Decide if you want to proceed without file output or exit
    }

    const provider = hre.ethers.provider;
    for (const recipientAddress of addresses) {
      let resultEntry = {
        address: recipientAddress,
        status: "Error during check",
        codePresent: false,
        nonce: 0,
        balance: "0",
        error: "",
      };
      try {
        const code = await provider.getCode(recipientAddress);
        const nonce = await provider.getTransactionCount(recipientAddress);
        const balance = await provider.getBalance(recipientAddress);
        const balanceFormatted = ethers.utils.formatEther(balance);

        resultEntry.codePresent = code !== "0x" && code !== "0x0";
        resultEntry.nonce = nonce;
        resultEntry.balance = balanceFormatted;

        let status = "";
        if (resultEntry.codePresent) {
          status = `Contract. Nonce: ${nonce}. Balance: ${balanceFormatted} ETH.`;
        } else if (nonce > 0) {
          status = `EOA (active). Nonce: ${nonce}. Balance: ${balanceFormatted} ETH.`;
        } else if (balance.gt(0)) {
          status = `EOA (funded, inactive). Nonce: ${nonce}. Balance: ${balanceFormatted} ETH.`;
        } else {
          status = `WARNING: Appears inactive/unused. Nonce: ${nonce}. Balance: ${balanceFormatted} ETH.`;
        }
        console.log(`Address ${recipientAddress}: ${status}`);
        resultEntry.status = status;
        delete resultEntry.error; // Remove error field if successful
      } catch (checkError: any) {
        console.error(
          `Error checking address ${recipientAddress}:`,
          checkError
        );
        resultEntry.status = `Error during check: ${checkError.message}`;
        resultEntry.error = checkError.message;
      }

      // Append result to JSON file
      try {
        const currentData = JSON.parse(
          fs.readFileSync(ADDRESS_CHECK_OUTPUT_FILE, "utf-8")
        );
        currentData.push(resultEntry);
        fs.writeFileSync(
          ADDRESS_CHECK_OUTPUT_FILE,
          JSON.stringify(currentData, null, 2)
        );
      } catch (fileError) {
        console.error(
          `Error updating ${ADDRESS_CHECK_OUTPUT_FILE} for address ${recipientAddress}:`,
          fileError
        );
        // Log the entry that failed to be written, so it's not lost
        console.log("Failed to write entry:", JSON.stringify(resultEntry));
      }
    }
    console.log(
      `Address existence checks complete. Results saved to ${ADDRESS_CHECK_OUTPUT_FILE}.\n`
    );
  }
  // --- END ADDRESS EXISTENCE CHECK ---
}

async function main() {
  try {
    console.log("Starting GHST distribution...");

    if (hre.network.name === "hardhat") {
      await mine();
    }

    // Amount of GHST to distribute (400,000 GHST for SZN1)
    const amount = "69549";

    console.log(
      `Distributing ${amount} GHST based on balances from JSON file...`
    );

    interface BalanceEntry {
      address: string;
      balance: string;
      stale: boolean;
      smartContract: boolean;
    }

    interface BalancesData {
      lastUpdated: string;
      accounts: BalanceEntry[];
    }

    const parsedBalancesData: BalancesData = balancesData as BalancesData;

    console.log(
      `Loaded balances data last updated on ${balancesData.lastUpdated}`
    );

    const addresses: string[] = [];
    const amounts: string[] = [];

    if (
      !parsedBalancesData ||
      !parsedBalancesData.accounts ||
      parsedBalancesData.accounts.length === 0
    ) {
      console.log(
        "No accounts found in balances data. No GHST will be distributed."
      );
      // The 'distribute-ghst' task will be called with empty address/amount lists.
    } else {
      // Calculate total balance from the JSON file, excluding smart contracts
      let totalBalanceInJson = ethers.constants.Zero;
      for (const entry of parsedBalancesData.accounts) {
        if (entry.smartContract) {
          // console.log(
          //   `Skipping smart contract ${entry.address} from total balance calculation.`
          // );
          continue;
        }
        if (entry.balance != null) {
          try {
            const balance = ethers.BigNumber.from(entry.balance.toString());
            totalBalanceInJson = totalBalanceInJson.add(balance);
          } catch (e) {
            // Error parsing balance for total sum. Silently skip adding to total.
            // User will handle overall errors.
          }
        }
      }

      console.log(
        `Total balance from JSON file (in wei, from non-smart contracts): ${totalBalanceInJson.toString()}`
      );

      if (totalBalanceInJson.isZero()) {
        console.log(
          "Total balance from non-smart contracts in JSON is zero. All remaining non-smart contract accounts will receive 0 GHST."
        );
        // Populate addresses with 0 amounts if total is zero but accounts exist
        for (const entry of parsedBalancesData.accounts) {
          if (entry.smartContract) {
            // Already logged during total calculation, or skip silently
            continue;
          }
          // Ensure address is valid before pushing
          if (
            entry.address &&
            typeof entry.address === "string" &&
            entry.address.trim() !== ""
          ) {
            addresses.push(entry.address);
            amounts.push("0");
          } else {
            // MODIFIED: Removed console.warn for invalid/missing address.
            // Entry is skipped if address is invalid/missing.
          }
        }
      } else {
        // Calculate distribution amounts based on proportion of totalBalanceInJson
        for (const entry of parsedBalancesData.accounts) {
          if (entry.smartContract) {
            continue;
          }
          // Ensure address is valid before processing and pushing
          if (
            !entry.address ||
            typeof entry.address !== "string" ||
            entry.address.trim() === "" ||
            entry.balance === null ||
            entry.balance === undefined ||
            entry.balance === "0" ||
            Number(entry.balance) === 0
          ) {
            // MODIFIED: Removed console.warn for invalid/missing address.
            // Entry is skipped.
            continue;
          }

          addresses.push(entry.address);
          amounts.push(entry.balance);
        }
      }
    }

    console.log(`Calculated distribution for ${addresses.length} addresses`);

    const vars = await varsForNetwork(hre.ethers);

    // Run the distribute-ghst task with the calculated addresses and amounts
    await run("distribute-ghst", {
      amount: amount,
      addresses: addresses.join(","),
      amounts: amounts.join(","),
      erc20: vars.ghst,
      tokenName: "ghst",
    });

    console.log("Distribution complete!");
  } catch (error) {
    console.error("Error in distribution script:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
