import { gql, GraphQLClient } from "graphql-request";

const graphqlClientUrl =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic";

const client = new GraphQLClient(graphqlClientUrl);

const variables = {};

const requestHeaders = {};

const getQuery = async (queryString: String) => {
  const query = gql`
    ${queryString}
  `;

  const data = await client.request(query, variables, requestHeaders);
  return data;
};

const getFinalizedEventsQuery = (startBlock: number, endBlock: number) => {
  // let skipNumber = currentPage ? currentPage * 1000 : 0;
  // skip:${skipNumber}

  return `{
      upgradeFinalizedEvents(
        first: 1000,
        where: { 
          block_gte: ${startBlock} 
          block_lte : ${endBlock}
        })
         {
      x
      y
      parcel {
        id
      }
      installation {
        id
      }
      timestamp
      block
      }
    }`;
};

export { getQuery, getFinalizedEventsQuery };
