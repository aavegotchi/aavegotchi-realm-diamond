/* global ethers hre task */

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { gasPrice } from "../constants";
import { impersonate } from "../scripts/helperFunctions";
import { maticRealmDiamondAddress } from "../scripts/tile/helperFunctions";
import { ERC721Facet, OwnershipFacet } from "../typechain";

export interface FixBuggedParcelArgs {
  parcelIds: string;
}

task("fixBuggedParcels", "Fixes bugged Parcels")
  .addParam("parcelIds", "String of realm parcel ids separated by commas")
  .setAction(
    async (taskArgs: FixBuggedParcelArgs, hre: HardhatRuntimeEnvironment) => {
      const testing = ["hardhat", "localhost"].includes(hre.network.name);

      const ownershipFacet = (await hre.ethers.getContractAt(
        "OwnershipFacet",
        maticRealmDiamondAddress
      )) as OwnershipFacet;

      const signer = new LedgerSigner(hre.ethers.provider, "m/44'/60'/2'/0/0");

      let erc721Facet = (await hre.ethers.getContractAt(
        "ERC721Facet",
        maticRealmDiamondAddress,
        signer
      )) as ERC721Facet;

      const owner = await ownershipFacet.owner();
      console.log("owner:", owner);
      if (testing) {
        erc721Facet = await impersonate(
          owner,
          erc721Facet,
          hre.ethers,
          hre.network
        );
      }

      const parcelIds = taskArgs.parcelIds.split(",");
      for (let i = 0; i < parcelIds.length; i++) {
        console.log(`Fixing Parcel ${parcelIds[i]}`);
        const tx = await erc721Facet.setIndex(parcelIds[i], {
          gasPrice: gasPrice,
        });
        await tx.wait();
        console.log("Fixed Parcel", parcelIds[i], "at txn ", tx.hash);
      }
    }
  );
