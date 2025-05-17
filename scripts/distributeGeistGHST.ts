import { run } from "hardhat";
import { ethers } from "ethers";
import balancesData from "./geist-ghst-balances-final.json";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  try {
    console.log("Starting GHST distribution...");

    await mine();

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
    const totalGhstToDistribute = ethers.utils.parseEther(amount);

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

    // Run the distribute-ghst task with the calculated addresses and amounts
    await run("distribute-ghst", {
      amount: amount,
      addresses: addresses.join(","),
      amounts: amounts.join(","),
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
