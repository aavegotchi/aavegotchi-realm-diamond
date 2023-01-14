import { logErrorToJSON, writeToJSON } from "./request/output";
import { fetchGraphQLData } from "./request/request";

const fetchEvents = async () => {
  const startBlock = 28520483; //26540483, no hashes exist until 28520483;
  const endBlock = 34327583;

  let startTime = new Date().getTime();

  let { results } = await fetchGraphQLData(startBlock, endBlock);

  // --- write to json file here ---
  writeToJSON(results);

  let endTime = new Date().getTime();

  console.log("STATISTICS:", {
    totalSize: results?.length,
    executionTime: (endTime - startTime) / 1000,
  });
};

if (require.main === module) {
  fetchEvents()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
