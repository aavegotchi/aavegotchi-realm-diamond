import { getQuery } from "./config";
import { getFinalizedEventsQuery } from "./config";

const fetchData = async (query: string) => {
  try {
    const queryResp = await getQuery(query);
    return { status: true, data: queryResp.upgradeFinalizedEvents };
  } catch (e) {
    return { status: false };
  }
};

const fetchGraphQLData = async (startBlock: number, endBlock: number) => {
  let results = [];
  const increment = 10000;

  for (
    let currentBlock = startBlock;
    currentBlock < endBlock;
    currentBlock = currentBlock + increment
  ) {
    const query = getFinalizedEventsQuery(
      currentBlock,
      currentBlock + increment
    );

    let { status, data } = await fetchData(query);

    console.log("---counter log---", currentBlock);

    if (status && data.length > 0) {
      //todo: This could be handled better but for simplicitys take we will just ensure that our increment is low enough to prevent us hitting the maximum number of events in one query.

      //If the number reaches 1000 it means we are missing events in that block range.
      if (data.length === 1000) {
        throw new Error("Too many results in range");
      }

      results.push(...data);

      console.log(
        `Start block: ${currentBlock}, end block: ${
          currentBlock + increment
        } data: ${data.length}`
      );
    } else {
      console.log(
        `No results found between blocks ${currentBlock} and ${
          currentBlock + increment
        }`
      );
    }
  }

  return { results };
};

export { fetchGraphQLData };
