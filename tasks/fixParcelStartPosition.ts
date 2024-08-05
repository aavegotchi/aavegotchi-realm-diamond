/* global ethers hre task */

import { LedgerSigner } from "@anders-t/ethers-ledger";
import request from "graphql-request";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice, varsForNetwork } from "../constants";
import { impersonate } from "../scripts/helperFunctions";
import { Ownable, RealmGridFacet } from "../typechain";

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });

export interface FixParcelStartPositionTaskArgs {
  parcelID: string;
  updateTiles: boolean;
  updateInstallation: boolean;
}

//To be used if a user has "wrong startPosition" error

const uri = process.env.GOTCHIVERSE_URI;

const batchSize = 500;

interface InstallationObject {
  id: string;
  x: string;
  y: string;
  type: { id: string };
  parcel: { id: string };
}

task("fixParcelStartPosition", "batch transfers alchemica to address")
  .addParam("parcelID", "parcel to fix")
  .setAction(
    async (
      taskArgs: FixParcelStartPositionTaskArgs,
      hre: HardhatRuntimeEnvironment
    ) => {
      let DEFAULT_BLOCKNUMBER = 0;
      let id = DEFAULT_BLOCKNUMBER;

      function getInstallationsQuery() {
        return `
        {installations(first: 1000 where: {parcel: "${taskArgs.parcelID}", id_gt:"${id}" equipped: true}) {
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
        {tiles(first: 1000 skip: 0 where: {parcel: "${taskArgs.parcelID}", id_gt:"${id}" equipped: true}) {
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

      const signer = new LedgerSigner(hre.ethers.provider, "m/44'/60'/1'/0/0");

      const c = await varsForNetwork(hre.ethers);

      let realmFacet = (await hre.ethers.getContractAt(
        "RealmGridFacet",
        c.realmDiamond,
        signer
      )) as RealmGridFacet;

      const testing = ["hardhat", "localhost"].includes(hre.network.name);

      let ownable = (await hre.ethers.getContractAt(
        "contracts/interfaces/Ownable.sol:Ownable",
        c.realmDiamond
      )) as Ownable;

      const owner = await ownable.owner();

      if (testing) {
        realmFacet = await impersonate(
          owner,
          realmFacet,
          hre.ethers,
          hre.network
        );
      }

      if (taskArgs.updateTiles) {
        // Tiles
        let tiles: InstallationObject[] = [];
        let tilesTmp = (await request(uri, getTilesQuery())).tiles;
        while (tilesTmp.length > 0) {
          id = tilesTmp[tilesTmp.length - 1].id;
          tiles = tiles.concat(tilesTmp);
          tilesTmp = (await request(uri, getTilesQuery())).tiles;

          // console.log("Tiles: ", tiles.length);

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
      }

      if (taskArgs.updateInstallation) {
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

        console.log("installations:", installations);

        console.log("Fixing installation start positions");

        const batches = Math.ceil(installations.length / batchSize);

        for (let i = 0; i < batches; i++) {
          console.log("current batch:", i);
          let realmIds = installations
            .slice(i * batchSize, (i + 1) * batchSize)
            .map((val) => val.parcel.id);
          let xs = installations
            .slice(i * batchSize, (i + 1) * batchSize)
            .map((val) => val.x);
          let ys = installations
            .slice(i * batchSize, (i + 1) * batchSize)
            .map((val) => val.y);
          let ids = installations
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
            false,
            ids,
            { gasPrice: gasPrice }
          );

          console.log("TXID: ", tx.hash, tx.gasLimit.toString());
          await tx.wait();
        }
      }
    }
  );
