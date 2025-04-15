import { run } from "hardhat";
import { GraphQLClient, gql } from "graphql-request";
import { ethers } from "ethers";

const baseUrl = process.env.AGC_SUBGRAPH;

interface LeaderboardEntry {
  id: string;
  gotchiPoints: string;
}

// function getMultiplierForRank(rank: number): number {
//   // Multipliers from SZN1 leaderboard
//   const multipliers = {
//     1: 10,
//     2: 8,
//     3: 6,
//     4: 5,
//     5: 5,
//     6: 5,
//     7: 5,
//     8: 5,
//     9: 5,
//     10: 5,
//     11: 3.5,
//     12: 3.5,
//     13: 3.5,
//     14: 3.5,
//     15: 3.5,
//     16: 3.5,
//     17: 3.5,
//     18: 3.5,
//     19: 3.5,
//     20: 3.5,
//     21: 3.5,
//     22: 3.5,
//     23: 3.5,
//     24: 3.5,
//     25: 3.5,
//     26: 3,
//     27: 3,
//     28: 3,
//     29: 3,
//     30: 3,
//     31: 3,
//     32: 3,
//     33: 3,
//     34: 3,
//     35: 3,
//     36: 3,
//     37: 3,
//     38: 3,
//     39: 3,
//     40: 3,
//     41: 3,
//     42: 3,
//     43: 3,
//     44: 3,
//     45: 3,
//     46: 3,
//     47: 3,
//     48: 3,
//     49: 3,
//     50: 3,
//     51: 2,
//     52: 2,
//     53: 2,
//     54: 2,
//     55: 2,
//     56: 2,
//     57: 2,
//     58: 2,
//     59: 2,
//     60: 2,
//     61: 2,
//     62: 2,
//     63: 2,
//     64: 2,
//     65: 2,
//     66: 2,
//     67: 2,
//     68: 2,
//     69: 2,
//     70: 2,
//     71: 2,
//     72: 2,
//     73: 2,
//     74: 2,
//     75: 2,
//     76: 2,
//     77: 2,
//     78: 2,
//     79: 2,
//     80: 2,
//     81: 2,
//     82: 2,
//     83: 2,
//     84: 2,
//     85: 2,
//     86: 2,
//     87: 2,
//     88: 2,
//     89: 2,
//     90: 2,
//     91: 2,
//     92: 2,
//     93: 2,
//     94: 2,
//     95: 2,
//     96: 2,
//     97: 2,
//     98: 2,
//     99: 2,
//     100: 2,
//   };
//   return multipliers[rank as keyof typeof multipliers] || 1; // Default to 1x for other ranks
// }

function getMultiplierForRank(rank: number): number {
  // Define rank ranges and their corresponding multipliers
  const rankRanges = [
    { min: 1, max: 1, multiplier: 10 },
    { min: 2, max: 2, multiplier: 8 },
    { min: 3, max: 3, multiplier: 6 },
    { min: 4, max: 10, multiplier: 5 },
    { min: 11, max: 25, multiplier: 3.5 },
    { min: 26, max: 50, multiplier: 3 },
    { min: 51, max: 100, multiplier: 2 },
  ];

  // Find the appropriate multiplier for the given rank
  const range = rankRanges.find(
    (range) => rank >= range.min && rank <= range.max
  );
  return range ? range.multiplier : 1; // Default to 1x for other ranks
}

async function main() {
  try {
    console.log("Starting GHST distribution...");

    // Amount of GHST to distribute (400,000 GHST for SZN1)
    const amount = "400000";

    console.log(`Distributing ${amount} GHST based on leaderboard results...`);

    // Query the leaderboard data
    const client = new GraphQLClient(baseUrl);
    const query = gql`
      query GetLeaderboard {
        accounts(
          first: 1000
          orderBy: gotchiPoints
          orderDirection: desc
          where: { gotchiPoints_gt: "0" }
        ) {
          id
          gotchiPoints
        }
      }
    `;

    console.log("Fetching leaderboard data...");
    const data = (await client.request(query)) as {
      accounts: LeaderboardEntry[];
    };

    console.log(`Found ${data.accounts.length} accounts with points`);

    const leaderboard = data.accounts;
    let totalWeightedPoints = 0;
    const weightedPointsMap = new Map<string, number>();

    // Calculate weighted points for each address
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const points = Number(ethers.utils.formatEther(entry.gotchiPoints));
      const multiplier = getMultiplierForRank(i + 1);
      const weightedPoints = points * multiplier;

      weightedPointsMap.set(entry.id, weightedPoints);
      totalWeightedPoints += weightedPoints;
    }

    // Calculate distribution amounts
    const totalAmount = ethers.utils.parseEther(amount);
    const addresses: string[] = [];
    const amounts: string[] = [];

    for (const [address, weightedPoints] of Array.from(
      weightedPointsMap.entries()
    )) {
      const share = weightedPoints / totalWeightedPoints;
      const amount = totalAmount
        .mul(Math.floor(share * 1000000000))
        .div(1000000000);

      addresses.push(address);
      amounts.push(amount.toString());
    }

    console.log(`Calculated distribution for ${addresses.length} addresses`);
    console.log(`Total weighted points: ${totalWeightedPoints}`);

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
