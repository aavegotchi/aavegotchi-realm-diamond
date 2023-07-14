const apollo = require("apollo-fetch");
const uri =
  "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-matic/api";
// "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-mumbai/api";
const graph = apollo.createApolloFetch({
  uri,
});

const fs = require("fs").promises;

async function getParcels() {
  const currentBlock = 45013446;

  let allParcels = [];
  let id = 0;
  let parcels = [];
  do {
    let query = `
        {
          parcels(first: 2500  where:{ id_gt: ${id}} orderBy: id orderDirection: asc block: {number: ${currentBlock}}) {
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

    let response = await graph({ query });
    parcels = response.data.parcels;

    if (parcels.length > 0) {
      allParcels = allParcels.concat(parcels);
      id = parcels[parcels.length - 1].id;
    }
  } while (parcels.length > 0);
  console.log(allParcels.length);

  const json = JSON.stringify(allParcels);
  await fs.writeFile("./allParcels.json", json, "utf8");
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
