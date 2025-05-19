import { run } from "hardhat";
import hre from "hardhat";
import { ethers } from "ethers";

import balancesData from "./geist-usdc-balances-final.json";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  try {
    console.log("Starting USDC distribution...");

    if (hre.network.name === "hardhat") {
      await mine();
    }

    const parsedBalancesData = balancesData;

    const totalBalance = parsedBalancesData.reduce((acc, entry) => {
      if (entry.smartContract) {
        return acc;
      }
      return acc + entry.balance;
    }, 0);

    const omittedSmartContractBalance = parsedBalancesData.reduce(
      (acc, entry) => {
        if (entry.smartContract) {
          return acc + entry.balance;
        }
        return acc;
      },
      0
    );

    console.log(
      `Distributing ${totalBalance} USDC based on balances from JSON file...`
    );

    console.log(
      `Omitted smart contract balance: ${omittedSmartContractBalance}`
    );

    const addresses: string[] = [];
    const amounts: string[] = [];

    if (!parsedBalancesData || parsedBalancesData.length === 0) {
      console.log(
        "No accounts found in balances data. No USDC will be distributed."
      );
    } else {
      // Calculate total balance from the JSON file, excluding smart contracts
      let totalBalanceInJson = ethers.constants.Zero;
      for (const entry of parsedBalancesData) {
        if (entry.smartContract) {
          // console.log(
          //   `Skipping smart contract ${entry.address} from total balance calculation.`
          // );
          continue;
        }
        if (entry.balance != null) {
          try {
            const balance = ethers.utils.parseUnits(
              entry.balance.toString(),
              6
            );
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
          "Total balance from non-smart contracts in JSON is zero. All remaining non-smart contract accounts will receive 0 USDC."
        );
        // Populate addresses with 0 amounts if total is zero but accounts exist
        for (const entry of parsedBalancesData) {
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
        for (const entry of parsedBalancesData) {
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
            entry.balance === 0
          ) {
            // MODIFIED: Removed console.warn for invalid/missing address.
            // Entry is skipped.
            continue;
          }

          addresses.push(entry.address);
          amounts.push(
            ethers.utils.parseUnits(entry.balance.toString(), 6).toString()
          );
        }
      }
    }

    console.log(`Calculated distribution for ${addresses.length} addresses`);

    // Run the distribute-ghst task with the calculated addresses and amounts
    await run("distribute-erc20", {
      amount: totalBalance.toString(),
      addresses: addresses.join(","),
      amounts: amounts.join(","),
      erc20: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      tokenName: "usdc",
      tokenDecimals: "6",
      tokenDistributorAddress: "0x8790258AD890d03383F81a3f57D40E6b547b1ef6",
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
