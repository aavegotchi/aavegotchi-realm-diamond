import { run } from "hardhat";
import { GraphQLClient, gql } from "graphql-request";
import { ethers } from "ethers";

const baseUrl = process.env.AGC_SUBGRAPH;

interface LeaderboardEntry {
  id: string;
  gotchiPoints: string;
}

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

    const blockNumber = 2582172;

    // Query the leaderboard data
    const client = new GraphQLClient(baseUrl);
    const query = gql`
      query GetLeaderboard {
        accounts(
          first: 1000
          orderBy: gotchiPoints
          orderDirection: desc
          where: { gotchiPoints_gt: "0" }
          block: { number: ${blockNumber} }
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
