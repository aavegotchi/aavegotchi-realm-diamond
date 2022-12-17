import { writeFileSync } from "fs";
import { gql, GraphQLClient } from "graphql-request";

const graphqlClientUrl =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic";

const path = "scripts/xmasInstallationEvents.json";
const client = new GraphQLClient(graphqlClientUrl);

const startBlock = "26540483";
const endBlock = "36902871";

const getCraftEvents = () => {
  return `{
    first: mintInstallationEvents(first: 1000, skip: 0, where:{installationType_in: ["152", "153","154","155"], block_gte:${startBlock} ,block_lte:${endBlock}}) {
      owner
    }
    second: mintInstallationEvents(first: 1000, skip: 1000, where:{installationType_in: ["152", "153","154","155"],  block_gte:${startBlock} ,block_lte:${endBlock}}) {
      owner
    }
    third: mintInstallationEvents(first: 1000, skip: 2000, where:{installationType_in: ["152", "153","154","155"],  block_gte:${startBlock} ,block_lte:${endBlock}}) {
      owner
    }
    fourth: mintInstallationEvents(first: 1000, skip: 3000, where:{installationType_in: ["152", "153","154","155"], block_gte:${startBlock} ,block_lte:${endBlock}}) {
      owner
    }
    fifth: mintInstallationEvents(first: 1000, skip: 4000, where:{installationType_in: ["152", "153","154","155"], block_gte:${startBlock} ,block_lte:${endBlock}}) {
      owner
    }
  }
    `;
};

const getQuery = async (queryString: String) => {
  const query = gql`
    ${queryString}
  `;
  const data = await client.request(query, {}, {});
  let addresses = [];
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      for (const element of data[key]) {
        addresses.push(element.owner);
      }
    }
  }
  console.log(`retrieved ${addresses.length} addresses`);
  writeToJSON(addresses);
  const unique = Array.from(new Set(addresses));
  console.log(`retrieved ${unique.length} unique addresses`);
};

const writeToJSON = (data: any) => {
  try {
    writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
    console.log("Data successfully saved to file");
  } catch (error) {
    console.log("An error has occurred ", error);
  }
};

getQuery(getCraftEvents());
