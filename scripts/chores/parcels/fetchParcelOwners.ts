import { upgradeRealmParcelGetter } from "../../realm/upgrades/upgrade-parcelGetters";
import { ethers } from "hardhat";
import { RealmGettersAndSettersFacet } from "../../../typechain-types";
import { varsForNetwork } from "../../../constants";

const apollo = require("apollo-fetch");
const uri =
  // "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-matic/api";
"https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-mumbai/api";
const graph = apollo.createApolloFetch({
  uri,
});

const fs = require("fs").promises;

async function getParcels() {
  const currentBlock = 37933100;

  // Get all parcel ids
  let allParcelIds = [];
  let id = 0;
  let parcels = [];
  do {
    let query = `
        {
          parcels(first: 2500  where:{ id_gt: ${id}} orderBy: id orderDirection: asc block: {number: ${currentBlock}}) {
            id
          }
        }
      `;

    let response = await graph({ query });
    parcels = response.data.parcels;

    if (parcels.length > 0) {
      allParcelIds = allParcelIds.concat(parcels.map(parcel => parcel.id));
      id = parcels[parcels.length - 1].id;
    }
  } while (parcels.length > 0);
  console.log("allParcelIds", allParcelIds);

  // run upgrade for getter function on hardhat
  await upgradeRealmParcelGetter();

  // get all parcel metadata onchain
  const c = await varsForNetwork(ethers);
  const realmGettersAndSettersFacet = (await ethers.getContractAt(
    "RealmGettersAndSettersFacet",
    c.realmDiamond
  )) as RealmGettersAndSettersFacet;
  let step = 30;
  let sliceStep = allParcelIds.length / step;
  let allParcels = [];
  for (let i = 0; i < step; i++) {
    const parcels = await realmGettersAndSettersFacet.getParcels(allParcelIds.slice(sliceStep * i, sliceStep * (i + 1)));
    allParcels = allParcels.concat(parcels);
  }
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
