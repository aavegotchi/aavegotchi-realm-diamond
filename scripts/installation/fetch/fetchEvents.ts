import { logErrorToJSON, writeToJSON } from "./request/output";
import { fetchGraphQLData } from "./request/request";

const mainApp = async () => {
  let startBlock = 26540483;
  let endBlock = 34327583;

  let dataSize = 1000;

  let startTime = new Date().getTime();

  let { failedPages, results } = await fetchGraphQLData(
    startBlock,
    endBlock,
    dataSize
  );

  let resultsToSet = new Set(results);
  let removedDuplicateData = [...resultsToSet];

  // --- write to json file here ---
  writeToJSON(removedDuplicateData);

  logErrorToJSON(failedPages);

  let endTime = new Date().getTime();

  console.log("STATISTICS:", {
    failedPages,
    totalSize: removedDuplicateData?.length,
    executionTime: (endTime - startTime) / 1000,
  });
};

if (require.main === module) {
  mainApp()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
