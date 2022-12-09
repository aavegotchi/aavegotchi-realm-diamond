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

const fetchGraphQLData = async (
  startBlock: number,
  endBlock: number,
  dataSize: number
) => {
  let maxPageCount = 100000000000000000; // replace with your language MAX SAFE INTEGER
  let failedPages = [];
  let results = [];
  let start = startBlock;
  let end = endBlock;

  for (let currentPage = 0; currentPage < maxPageCount; currentPage++) {
    const query = getFinalizedEventsQuery(start, end, dataSize);

    let { status, data } = await fetchData(query);
    console.log("---counter log---", currentPage);

    if (status) {
      start = data[data.length - 1]?.block;

      results.push(...data);
      if (data?.length < dataSize) {
        // --- break the loop when the batch data is below the dataSize. That means we've come to the end of the pagination ---
        break;
      }
    } else {
      failedPages.push({ currentPage, start, end });
    }
  }

  return { failedPages, results };
};

export { fetchGraphQLData };
