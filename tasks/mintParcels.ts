/* global ethers hre task */

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice } from "../constants";
import { parcelMetadataFromTokenIds } from "../helpers/metadataHelpers";
import { impersonate } from "../scripts/helperFunctions";
import { ERC721Facet, OwnershipFacet, RealmFacet } from "../typechain";
import { MintParcelInput } from "../types";

export interface MintParcelsTaskArgs {
  tokenIds: string;
  diamondAddress: string;
  toAddresses: string;
}

task("mintParcels", "Mints parcels")
  .addParam("tokenIds", "String of token Ids separated by commas")
  .addParam("diamondAddress", "Diamond address")
  .addParam("toAddresses")
  .setAction(
    async (taskArgs: MintParcelsTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const tokenIds = taskArgs.tokenIds.split(",");
      const addresses = taskArgs.toAddresses.split(",");

      for (let i = 0; i < tokenIds.length; i++) {
        console.log(`Minting ${tokenIds[i]} to ${addresses[i]}`);
      }

      const testing = ["hardhat", "localhost"].includes(hre.network.name);

      const parcels: MintParcelInput[] = await parcelMetadataFromTokenIds(
        tokenIds
      );

      console.log("parcels:", parcels);

      const ownershipFacet = (await hre.ethers.getContractAt(
        "OwnershipFacet",
        taskArgs.diamondAddress
      )) as OwnershipFacet;

      const signer = new LedgerSigner(hre.ethers.provider, "m/44'/60'/2'/0/0");

      let realmFacet = (await hre.ethers.getContractAt(
        "RealmFacet",
        taskArgs.diamondAddress,
        signer
      )) as RealmFacet;

      const owner = await ownershipFacet.owner();
      console.log("owner:", owner);

      if (testing) {
        realmFacet = await impersonate(
          owner,
          realmFacet,
          hre.ethers,
          hre.network
        );
      }

      const tx = await realmFacet.mintParcels(addresses, tokenIds, parcels, {
        gasPrice: gasPrice,
      });
      await tx.wait();
      console.log(tx.hash);
    }
  );
