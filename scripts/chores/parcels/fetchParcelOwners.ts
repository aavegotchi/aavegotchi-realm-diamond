import { upgradeRealmParcelGetter } from "../../realm/upgrades/upgrade-parcelGetters";
import { ethers } from "hardhat";
import { RealmGettersAndSettersFacet } from "../../../typechain-types";
import { varsForNetwork } from "../../../constants";

const apollo = require("apollo-fetch");
const uri =
  "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-matic/api";
// "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-mumbai/api";
const graph = apollo.createApolloFetch({
  uri,
});

const fs = require("fs").promises;

async function getParcels() {
  const currentBlock = 37933100;

  // Get all parcel ids
  let nonEmptyParcels = [];
  let nonEmptyParcelIds = [];
  let emptyParcels = [];
  let id = 0;
  let parcels = [];
  do {
    let query = `
        {
          parcels(first: 2500  where:{ id_gt: ${id}} orderBy: id orderDirection: asc) {
            id
            equippedTiles {
              id
            }
            equippedInstallations {
              id
            }
            coordinateX
            coordinateY
            district
            alphaBoost
            fomoBoost
            fudBoost
            kekBoost
            lastChanneledAlchemica
            lastClaimedAlchemica
            remainingAlchemica
            owner
            parcelHash
            parcelId
            size
            tokenId
          }
        }
      `;

    let response = await graph({ query });
    parcels = response.data.parcels;

    if (parcels.length > 0) {
      nonEmptyParcelIds = nonEmptyParcelIds.concat(parcels.filter(parcel => ((parcel.equippedTiles.length > 0) || (parcel.equippedTiles.equippedInstallations > 0))).map(parcel => Number(parcel.id)));
      emptyParcels = emptyParcels.concat(parcels.filter(parcel => ((parcel.equippedTiles.length == 0) && (parcel.equippedTiles.equippedInstallations == 0))));
      id = parcels[parcels.length - 1].id;
    }
  } while (parcels.length > 0);

  // Write empty parcels to JSON file.
  // await fs.writeFile("./emptyParcels.json", JSON.stringify(emptyParcels), "utf8");

  // fetch non-empty parcels
  console.log("nonEmptyParcelIds", nonEmptyParcelIds);

  // run upgrade for getter function on hardhat
  // await upgradeRealmParcelGetter();

  // get all parcel metadata onchain
  const c = await varsForNetwork(ethers);
  const realmGettersAndSettersFacet = (await ethers.getContractAt(
    "RealmGettersAndSettersFacet",
    c.realmDiamond
  )) as RealmGettersAndSettersFacet;

  for (let i = 0; i < nonEmptyParcelIds.length; i++) {
    console.log('parcel id:', nonEmptyParcelIds[i])
    try {
      const parcel: RealmGettersAndSettersFacet.ParcelOutTestStruct = await realmGettersAndSettersFacet.getParcel(nonEmptyParcelIds[i]);
      // console.log(parcel)
      await fs.writeFile(`./parcel-${nonEmptyParcelIds[i]}.json`, JSON.stringify(parcel), "utf8");
      nonEmptyParcels.push(parcel);
    } catch (e) {
      console.log("ERROR", e);
    }
  }

  await fs.writeFile("./nonEmptyParcels.json", JSON.stringify(nonEmptyParcels), "utf8");
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
