import { readFileSync, writeFileSync } from "fs";

const path = "scripts/installation/fetch/LevelOneEvents.json";
const cleanedJsonDataFile =
  "scripts/installation/fetch/finalizedLevelOneEvents.json";
const removedJsonDataFile =
  "scripts/installation/fetch/finalizedLevelOneEvents.json";

const writeToJSON = (data: any) => {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    console.log("Data successfully saved to file");
  } catch (error) {
    console.log("An error has occurred ", error);
  }
};

const readFromJSON = () => {
  let rawdata = readFileSync(path);
  return JSON.parse(rawdata.toString());
};

const writeCleanedDataToJSON = (data: any) => {
  try {
    writeFileSync(cleanedJsonDataFile, JSON.stringify(data, null, 2), "utf8");
    console.log("Data successfully saved to file");
  } catch (error) {
    console.log("An error has occurred ", error);
  }
};

const writeRemovedDataToJSON = (data: any) => {
  try {
    writeFileSync(removedJsonDataFile, JSON.stringify(data, null, 2), "utf8");
    console.log("Data successfully saved to file");
  } catch (error) {
    console.log("An error has occurred ", error);
  }
};

const logErrorToJSON = (data: any) => {
  try {
    writeFileSync(
      "./src/output/errors.json",
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } catch (error) {
    console.log("An error has occurred ", error);
  }
};

export {
  writeToJSON,
  logErrorToJSON,
  readFromJSON,
  writeCleanedDataToJSON,
  writeRemovedDataToJSON,
};
