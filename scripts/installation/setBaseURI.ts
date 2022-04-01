import { BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";

import { ERC1155Facet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();

  const diamondAddress = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";

  const testing = ["hardhat"].includes(network.name);

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let erc1155facet = (await ethers.getContractAt(
    "ERC1155Facet",
    diamondAddress
  )) as ERC1155Facet;

  if (testing) {
    erc1155facet = await impersonate(owner, erc1155facet, ethers, network);
  }

  let baseUri = await erc1155facet.uri("1");
  console.log("base uri:", baseUri);

  //   const tx = await erc1155facet.setBaseURI(
  //     "https://app.aavegotchi.com/metadata/installation/"
  //   );
  //   await tx.wait();

  //   baseUri = await erc1155facet.uri("1");
  //   console.log("base uri:", baseUri);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
