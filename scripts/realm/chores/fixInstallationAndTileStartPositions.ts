const hre = require("hardhat");
import { request } from "graphql-request";
import { ethers, network } from "hardhat";
import { Ownable, RealmGridFacet } from "../../../typechain";
import { impersonate } from "../../helperFunctions";
import { upgrade } from "../upgrades/upgrade-fixStartGrid";
import { gasPrice, varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";

let DEFAULT_BLOCKNUMBER = 0;
let id = DEFAULT_BLOCKNUMBER;

interface InstallationObject {
  id: string;
  x: string;
  y: string;
  type: { id: string };
  parcel: { id: string };
}

const uri =
  "https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic";

function getInstallationsQuery() {
  return `
    {installations(first: 1000 where: {id_gt:"${id}" equipped: true}) {
      id
      x
      y
      type {
        id
      }
      parcel {
        id
      }
    }}`;
}

function getTilesQuery() {
  return `
    {tiles(first: 1000 skip: 0 where: {id_gt:"${id}" equipped: true}) {
      id
      x
      y
      type {
        id
      }
      parcel {
        id
      }
    }}`;
}

async function main() {
  // await upgrade();

  // Tiles
  let tiles: InstallationObject[] = [];
  let tilesTmp = (await request(uri, getTilesQuery())).tiles;
  while (tilesTmp.length > 0) {
    id = tilesTmp[tilesTmp.length - 1].id;
    tiles = tiles.concat(tilesTmp);
    tilesTmp = (await request(uri, getTilesQuery())).tiles;

    // console.log("Tiles: ", tiles.length);
  }

  // Installations
  id = DEFAULT_BLOCKNUMBER;
  let installations: InstallationObject[] = [];
  let installationsTmp = (await request(uri, getInstallationsQuery()))
    .installations;

  while (installationsTmp.length > 0) {
    id = installationsTmp[installationsTmp.length - 1].id;
    installations = installations.concat(installationsTmp);
    installationsTmp = (await request(uri, getInstallationsQuery()))
      .installations;
  }

  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const c = await varsForNetwork(ethers);

  let realmFacet = (await ethers.getContractAt(
    "RealmGridFacet",
    c.realmDiamond,
    signer
  )) as RealmGridFacet;

  let ownable = (await ethers.getContractAt(
    "contracts/interfaces/Ownable.sol:Ownable",
    c.realmDiamond
  )) as Ownable;

  const owner = await ownable.owner();

  if (testing) {
    realmFacet = await impersonate(owner, realmFacet, ethers, network);

    console.log("tile length:", tiles.length);
    console.log("installation length:", installations.length);
  }

  console.log("Fixing installation start positions");
  const batchSize = 500;
  const batches = Math.ceil(installations.length / batchSize);

  // for (let i = 8; i < batches; i++) {
  //   console.log("current batch:", i);
  //   let realmIds = installations
  //     .slice(i * batchSize, (i + 1) * batchSize)
  //     .map((val) => val.parcel.id);
  //   let xs = installations
  //     .slice(i * batchSize, (i + 1) * batchSize)
  //     .map((val) => val.x);
  //   let ys = installations
  //     .slice(i * batchSize, (i + 1) * batchSize)
  //     .map((val) => val.y);
  //   let ids = installations
  //     .slice(i * batchSize, (i + 1) * batchSize)
  //     .map((val) => val.type.id);

  //   console.log("realm ids:", realmIds);
  //   console.log("xs", xs);
  //   console.log("ys", ys);
  //   console.log("ids:", ids);

  //   let tx = await realmFacet.fixGridStartPositions(
  //     realmIds,
  //     xs,
  //     ys,
  //     false,
  //     ids,
  //     { gasPrice: gasPrice }
  //   );

  //   console.log("TXID: ", tx.hash, tx.gasLimit.toString());
  //   await tx.wait();
  // }

  console.log("Fixing tile start positions");
  for (let i = 0; i < tiles.length / batchSize; i++) {
    console.log("current batch:", i);

    let realmIds = tiles
      .slice(i * batchSize, (i + 1) * batchSize)
      .map((val) => val.parcel.id);
    let xs = tiles
      .slice(i * batchSize, (i + 1) * batchSize)
      .map((val) => val.x);
    let ys = tiles
      .slice(i * batchSize, (i + 1) * batchSize)
      .map((val) => val.y);
    let ids = tiles
      .slice(i * batchSize, (i + 1) * batchSize)
      .map((val) => val.type.id);

    console.log("realm ids:", realmIds);
    console.log("xs", xs);
    console.log("ys", ys);
    console.log("ids:", ids);

    let tx = await realmFacet.fixGridStartPositions(
      realmIds,
      xs,
      ys,
      true,
      ids,
      { gasPrice: gasPrice }
    );

    console.log("TXID: ", tx.hash);
    await tx.wait();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
