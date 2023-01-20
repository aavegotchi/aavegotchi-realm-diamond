const competitions = require("./competitions.json");
const axios = require("axios").default;
const ethers = require("ethers");
const { DateTime } = require("luxon");

export interface Competition {
  timeFrom: number;
  timePeriod: String;
  dayModifiers: Array<number>;
  ghstPayouts: Array<number>;
}

interface LeaderboardEntry {
  account: string;
  total: number;
  ghstReward: number;
}

interface InstallationType {
  id: String;
  installationType: number;
  alchemicaCost: Array<String>;
  name: String;
}

interface TileType {
  id: String;
  tileType: number;
  alchemicaCost: Array<String>;
  name: String;
}

interface MintTileEvent {
  id: String;
  block: String;
  timestamp: String;
  owner: String;
  quantity: number;
  tile: TileType;
}

interface MintInstallationEvent {
  id: String;
  block: String;
  timestamp: String;
  owner: String;
  quantity: number;
  installation: InstallationType;
}

const getCompetition = (
  timeFrom: Number,
  timePeriod: String
): Competition | false => {
  const filteredCompetitions = competitions.filter(
    (c) => c.timeFrom == timeFrom && c.timePeriod == timePeriod
  );

  if (filteredCompetitions.length > 0) {
    return filteredCompetitions[0];
  }

  return false;
};

const getGhstReward = (
  index: number,
  competition: Competition | false
): number => {
  if (competition && competition.ghstPayouts[index]) {
    return competition.ghstPayouts[index];
  }

  return 0;
};

const getMultiplier = (
  timestamp: number,
  competition: Competition | false
): number => {
  if (!competition) {
    return 1;
  }
  let dateTime = DateTime.fromSeconds(Number(timestamp), { zone: "utc" });

  let weekdayIndex = dateTime.weekday - 1;
  return competition.dayModifiers[weekdayIndex];
};

const mintTileEvents = async (
  timeFrom: number,
  timeTo: number
): Promise<Array<MintTileEvent>> => {
  let results = [];
  let numOfResults = 0;
  let lastId = "";
  do {
    const response = await axios.post(
      "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic",
      JSON.stringify({
        query: `{
          mintTileEvents(first: 1000, where: {
            ${timeFrom ? `timestamp_gt:${timeFrom}` : ""} 
            ${timeTo ? `timestamp_lt:${timeTo}` : ""} 
            id_gt: "${lastId}"}) 
            {
            id
            block
            timestamp
            owner
            quantity
            tile {
              id
              tileType
              alchemicaCost
              name
            }
          }
        }`,
      })
    );

    if (response?.data?.data?.mintTileEvents.length) {
      results = [...results, ...response.data.data.mintTileEvents];

      lastId =
        response.data.data.mintTileEvents[
          response.data.data.mintTileEvents.length - 1
        ].id;

      numOfResults = response.data.data.mintTileEvents.length;
    } else {
      numOfResults = 0;
    }
  } while (numOfResults);
  return results;
};

const mintInstallationEvents = async (
  timeFrom: number,
  timeTo: number
): Promise<Array<MintInstallationEvent>> => {
  let results = [];
  let numOfResults = 0;
  let lastId = "";
  do {
    const response = await axios.post(
      "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic",
      JSON.stringify({
        query: `{
          mintInstallationEvents(first: 1000, where: {
            ${timeFrom ? `timestamp_gt:${timeFrom}` : ""} 
            ${timeTo ? `timestamp_lt:${timeTo}` : ""} 
            id_gt: "${lastId}"}) {
            id
            block
            timestamp
            owner
            quantity
            installationType {
              id
              level
              installationType
              alchemicaCost
              name
            }
          }
        }`,
      })
    );

    if (response?.data?.data?.mintInstallationEvents.length) {
      results = [...results, ...response.data.data.mintInstallationEvents];

      lastId =
        response.data.data.mintInstallationEvents[
          response.data.data.mintInstallationEvents.length - 1
        ].id;

      numOfResults = response.data.data.mintInstallationEvents.length;
    } else {
      numOfResults = 0;
    }
  } while (numOfResults);

  return results;
};

const groupBy = (list: Array<any>, keyGetter: any): Map<String, any> => {
  const map = new Map();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });

  return map;
};

const transform = (owner, alchemicaCost, modifier, quantity = 1) => {
  const fudSpent = Number(ethers.utils.formatEther(alchemicaCost[0]));
  const fomoSpent = Number(ethers.utils.formatEther(alchemicaCost[1])) * 2;
  const alphaSpent = Number(ethers.utils.formatEther(alchemicaCost[2])) * 4;
  const kekSpent = Number(ethers.utils.formatEther(alchemicaCost[3])) * 10;

  const totalSpend = (fudSpent + fomoSpent + alphaSpent + kekSpent) * quantity;
  const totalSpendWMultiplier = totalSpend * modifier;
  return { owner, totalSpend, totalSpendWMultiplier };
};

function getTimeTo(timeFrom, period) {
  if (period == "week") {
    return timeFrom + 604800;
  }

  return timeFrom;
}

export async function generateLeaderboard(
  timeFrom: number,
  timePeriod: string
): Promise<Array<LeaderboardEntry>> {
  let competition = getCompetition(timeFrom, timePeriod);
  let timeTo = getTimeTo(timeFrom, timePeriod);

  const values = await Promise.all([
    mintTileEvents(timeFrom, timeTo),
    mintInstallationEvents(timeFrom, timeTo),
  ]);

  const allResults = [];
  values.forEach((e) => {
    e.forEach((f) => {
      const owner = f.owner;
      const alchemicaCost = f.installationType
        ? f.installationType.alchemicaCost
        : f.tileType.alchemicaCost;
      const quantity = f.quantity;
      const multiplier = getMultiplier(f.timestamp, competition);
      allResults.push(transform(owner, alchemicaCost, multiplier, quantity));
    });
  });

  let spendOwners = groupBy(allResults, (value) => value.owner);
  const unsortedLeaderboard = [];
  spendOwners.forEach((e, k) => {
    const v = e
      .map((f) => (competition ? f.totalSpendWMultiplier : f.totalSpend))
      .reduce((prev, next) => {
        if (!prev) return next;
        return prev + next;
      });

    unsortedLeaderboard.push({ account: k, total: v });
  });

  const sortedLeaderboard = unsortedLeaderboard
    .sort((a, b) => {
      return b.total - a.total;
    })
    .map((e, i) => ({
      ...e,
      ghstReward: getGhstReward(i, competition),
      position: i + 1,
    }));

  return sortedLeaderboard;
}
