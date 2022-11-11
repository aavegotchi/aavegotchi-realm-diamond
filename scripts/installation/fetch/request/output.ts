import { writeFileSync } from "fs";

const path = "./scripts/installation/fetch/finalizedEvents.json";

const writeToJSON = (data: any) => {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    console.log("Data successfully saved to file");
  } catch (error) {
    console.log("An error has occurred ", error);
  }
};

// also add error blocks too sha ---

const logErrorToJSON = (data: any) => {
  try {
    writeFileSync(
      "./scripts/installation/fetch/errors.json",
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.log("An error has occurred ", error);
  }
};

export { writeToJSON, logErrorToJSON };
