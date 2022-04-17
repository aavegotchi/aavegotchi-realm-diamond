/* global ethers hre task */

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
  toAddress: string;
}

task("mintParcels", "Mints parcels")
  .addParam("tokenIds", "String of token Ids separated by commas")
  .addParam("diamondAddress", "Diamond address")
  .addParam("toAddress")
  .setAction(
    async (taskArgs: MintParcelsTaskArgs, hre: HardhatRuntimeEnvironment) => {
      const tokenIds = taskArgs.tokenIds.split(",");

      console.log(
        `Minting tokenIds: ${taskArgs.tokenIds} to address ${taskArgs.toAddress}`
      );

      const testing = ["hardhat", "localhost"].includes(hre.network.name);

      const parcels: MintParcelInput[] = await parcelMetadataFromTokenIds(
        tokenIds
      );

      const ownershipFacet = (await hre.ethers.getContractAt(
        "OwnershipFacet",
        taskArgs.diamondAddress
      )) as OwnershipFacet;

      let realmFacet = (await hre.ethers.getContractAt(
        "RealmFacet",
        taskArgs.diamondAddress
      )) as RealmFacet;

      const erc721facet = (await hre.ethers.getContractAt(
        "ERC721Facet",
        taskArgs.diamondAddress
      )) as ERC721Facet;

      const balance = await erc721facet.balanceOf(taskArgs.toAddress);
      console.log("Balance of recipient is:", balance.toString());

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

      const tx = await realmFacet.mintParcels(
        taskArgs.toAddress,
        tokenIds,
        parcels,
        { gasPrice: gasPrice }
      );
      await tx.wait();
      console.log(tx.hash);

      console.log(
        `Minted ${tokenIds.length} parcels starting with ${
          tokenIds[0]
        }, ending with ${tokenIds[tokenIds.length - 1]} and transferred to ${
          taskArgs.toAddress
        }`
      );
    }
  );
