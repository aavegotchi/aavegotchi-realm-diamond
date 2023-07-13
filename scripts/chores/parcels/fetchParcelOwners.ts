import request from "graphql-request";

export async function getParcels() {
  const gotchiverseSubgraph =
    "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic";
  const currentBlock = 45013446;

  const query = `
    {
      parcels(block: {number: ${currentBlock}}) {
        id
        owner
        tokenId
        parcelId
        parcelHash
        coordinateX
        coordinateY
        district
        alphaBoost
        fomoBoost
        fudBoost
        kekBoost
        lastChanneledAlchemica
        remainingAlchemica
        lastClaimedAlchemica
        surveyRound
        size
        equippedInstallations {
          id
          width
          height
        }
        equippedTiles {
          id
          height
          width
        }
      }
    }
  `;
  const parcelData = await request(gotchiverseSubgraph, query);
  console.log("parcelData", parcelData);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  getParcels()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
