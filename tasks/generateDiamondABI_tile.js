/* global ethers hre task */

const fs = require("fs");

const basePath = "/contracts/TileDiamond/facets/";
const libraryBasePath = "/contracts/libraries/";
// const sharedLibraryBasePath = "/contracts/libraries/";

task(
  "diamondABI_tile",
  "Generates ABI file for diamond, includes all ABIs of facets"
).setAction(async () => {
  let files = fs.readdirSync("." + basePath);

  let abi = [];
  for (let file of files) {
    const jsonFile = file.replace("sol", "json");

    let json = fs.readFileSync(`./artifacts${basePath}${file}/${jsonFile}`);
    json = JSON.parse(json);
    abi.push(...json.abi);
  }
  files = fs.readdirSync("." + libraryBasePath);
  for (const file of files) {
    let jsonFile = file.replace("sol", "json");
    if (
      [
        "AppStorage.json",
        "AppStorageInstallation.json",
        "AppStorageTile.json",
      ].includes(jsonFile)
    )
      jsonFile = "Modifiers.json";
    let json = fs.readFileSync(
      `./artifacts${libraryBasePath}${file}/${jsonFile}`
    );
    json = JSON.parse(json);
    abi.push(...json.abi);
  }
  // files = fs.readdirSync("." + sharedLibraryBasePath);
  // for (const file of files) {
  //   let jsonFile = file.replace("sol", "json");
  //   if (
  //     [
  //       "AppStorage.json",
  //       "AppStorageInstallation.json",
  //       "AppStorageTile.json",
  //     ].includes(jsonFile)
  //   )
  //     jsonFile = "Modifiers.json";
  //   let json = fs.readFileSync(
  //     `./artifacts${sharedLibraryBasePath}${file}/${jsonFile}`
  //   );
  //   json = JSON.parse(json);
  //   abi.push(...json.abi);
  // }
  abi = JSON.stringify(abi);
  fs.writeFileSync("./diamondABI/diamond_tile.json", abi);
  console.log("ABI written to diamondABI/diamond_tile.json");
});
