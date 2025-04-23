/* global ethers hre task */

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice, varsForNetwork } from "../constants";
import { impersonate } from "../scripts/helperFunctions";
import { maticRealmDiamondAddress } from "../scripts/tile/helperFunctions";
import {
  ERC721Facet,
  InstallationAdminFacet,
  OwnershipFacet,
} from "../typechain-types";
import { gql, GraphQLClient } from "graphql-request";
import { ethers } from "ethers";

export interface FixUpgradeHashesArgs {
  parcelIds: string;
}

interface UpgradeInitiatedEvent {
  x: number;
  y: number;
  parcel: { id: string };
  installation: { id: string };
}

interface DeleteBuggedUpgradesInput {
  _parcelId: string;
  _coordinateX: number;
  _coordinateY: number;
  _installationId: string;
}

const startBlock = 28520483; //26540483, no hashes exist until 28520483;
const endBlock = 34327583;
const graphqlClientUrl =
  "https://subgraph.satsuma-prod.com/tWYl5n5y04oz/aavegotchi/gotchiverse-matic/api";
const installationsIds = [
  "56",
  "65",
  "74",
  "83",
  "92",
  "101",
  "110",
  "119",
  "128",
  "10",
  "1",
];

const client = new GraphQLClient(graphqlClientUrl);

const INCREMENT = 100000; // Number of blocks to query at a time

// Convert installation IDs to stringified array
const stringifiedInstallationIds = `[${installationsIds.map(
  (id) => `"${id}"`
)}]`;

task("fixUpgradeHashes", "Fixes upgrade hashes for a parcel")
  .addParam("parcelIds", "String of realm parcel ids separated by commas")
  .setAction(
    async (taskArgs: FixUpgradeHashesArgs, hre: HardhatRuntimeEnvironment) => {
      const testing = ["hardhat", "localhost"].includes(hre.network.name);

      // Convert parcel IDs to stringified array
      const parcelIdsArray = taskArgs.parcelIds.split(",");
      const stringifiedParcelIds = `[${parcelIdsArray.map((id) => `"${id}"`)}]`;
      const c = await varsForNetwork(hre.ethers);

      let allEvents = [];

      for (
        let currentBlock = startBlock;
        currentBlock < endBlock;
        currentBlock += INCREMENT
      ) {
        const currentEndBlock = Math.min(currentBlock + INCREMENT, endBlock);

        const baseQuery = gql`
        {
          upgradeInitiatedEvents(
            first: 1000,
            where: { 
              block_gte: ${currentBlock} 
              block_lte: ${currentEndBlock}
              installation_in: ${stringifiedInstallationIds}    
              parcel_in: ${stringifiedParcelIds}
            }
          ) {
            x
            y
            parcel {
              id
            }
            installation {
              id
            }
          }
        }`;

        console.log(`Querying blocks ${currentBlock} to ${currentEndBlock}...`);

        const query = await client.request<{ upgradeInitiatedEvents: any[] }>(
          baseQuery
        );
        const data = query.upgradeInitiatedEvents;

        if (data.length === 1000) {
          throw new Error(
            `Hit GraphQL limit of 1000 results between blocks ${currentBlock} and ${currentEndBlock}. Please use a smaller block range.`
          );
        }

        allEvents.push(...data);
        console.log(`Found ${data.length} events in this block range`);
      }

      console.log(`Total events found: ${allEvents.length}`);

      const deleteBuggedUpgradesInput = toDeleteBuggedUpgradesInput(allEvents);

      const ownershipFacet = (await hre.ethers.getContractAt(
        "OwnershipFacet",
        c.installationDiamond
      )) as OwnershipFacet;

      //TO-DO: Use the correct signer
      const signer = new LedgerSigner(hre.ethers.provider, "m/44'/60'/1'/0/0");

      let installationAdminFacet = (await hre.ethers.getContractAt(
        "InstallationAdminFacet",
        c.installationDiamond,
        signer
      )) as InstallationAdminFacet;

      const owner = await ownershipFacet.owner();
      console.log("owner:", owner);
      if (testing) {
        installationAdminFacet = await impersonate(
          owner,
          installationAdminFacet,
          hre.ethers,
          hre.network
        );
      }

      console.log("Deleting bugged upgrades");
      const tx = await installationAdminFacet.deleteBuggedUpgrades(
        deleteBuggedUpgradesInput,
        { gasPrice: 35000000000 }
      );
      await tx.wait();
      console.log("Deleted bugged upgrades in txn", tx.hash);
    }
  );

function toDeleteBuggedUpgradesInput(
  data: UpgradeInitiatedEvent[]
): DeleteBuggedUpgradesInput[] {
  return data.map((event) => ({
    _parcelId: event.parcel.id,
    _coordinateX: event.x,
    _coordinateY: event.y,
    _installationId: event.installation.id,
  }));
}
