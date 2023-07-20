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
      nonEmptyParcelIds = nonEmptyParcelIds.concat(parcels.filter(parcel => parcel.equippedTiles.length > 0 || parcel.equippedInstallations > 0).map(parcel => Number(parcel.id)));
      emptyParcels = emptyParcels.concat(parcels.filter(parcel => !(parcel.equippedTiles.length > 0 || parcel.equippedInstallations > 0)).map(p => {
        return {
          owner: p.owner,
          parcelAddress: p.parcelHash,
          parcelId: p.parcelId,
          coordinateX: p.coordinateX,
          coordinateY: p.coordinateY,
          district: p.district,
          size: p.size,
          alchemicaBoost: [p.fudBoost, p.fomoBoost, p.alphaBoost, p.kekBoost],
          alchemicaRemaining: p.remainingAlchemica,
        }
      }));
      id = parcels[parcels.length - 1].id;
    }
  } while (parcels.length > 0);

  // Write empty parcels to JSON file.
  await fs.writeFile("./parcels/emptyParcels.json", JSON.stringify(emptyParcels), "utf8");

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
      const parcelObj = {
        owner: parcel.owner,
        parcelAddress: parcel.parcelAddress,
        parcelId: parcel.parcelId,
        coordinateX: parcel.coordinateX,
        coordinateY: parcel.coordinateY,
        district: parcel.district,
        size: parcel.size,
        alchemicaBoost: parcel.alchemicaBoost,
        alchemicaRemaining: parcel.alchemicaRemaining,
        currentRound: parcel.currentRound,
        roundBaseAlchemica: parcel.roundBaseAlchemica,
        roundAlchemica: parcel.roundAlchemica,
        reservoirs: parcel.reservoirs,
        alchemicaHarvestRate: parcel.alchemicaHarvestRate,
        lastUpdateTimestamp: parcel.lastUpdateTimestamp,
        unclaimedAlchemica: parcel.unclaimedAlchemica,
        altarId: parcel.altarId,
        upgradeQueueCapacity: parcel.upgradeQueueCapacity,
        upgradeQueueLength: parcel.upgradeQueueLength,
        lodgeId: parcel.lodgeId,
        surveying: parcel.surveying,
        harvesterCount: parcel.harvesterCount,
        buildGrid: parcel.buildGrid,
        tileGrid: parcel.tileGrid,
        startPositionBuildGrid: parcel.startPositionBuildGrid,
        startPositionTileGrid: parcel.startPositionTileGrid,
      }
      // console.log(parcelObj)
      // await fs.writeFile(`./parcels/parcel-${nonEmptyParcelIds[i]}.json`, JSON.stringify(parcelObj), "utf8");
      await fs.writeFile("./parcels/nonEmptyParcels.json", JSON.stringify(parcelObj),  { flag: "a", encoding: "utf8" });
    } catch (e) {
      console.log("ERROR", e);
    }
  }
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
