import { BigNumber, Signer } from "ethers";
import { ethers, network } from "hardhat";

import { ERC1155TileFacet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

export async function setAddresses() {
  const accounts: Signer[] = await ethers.getSigners();

  const diamondAddress = "";

  const testing = ["hardhat"].includes(network.name);

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let erc1155TileFacet = (await ethers.getContractAt(
    "ERC1155TileFacet",
    diamondAddress
  )) as ERC1155TileFacet;

  if (testing) {
    erc1155TileFacet = await impersonate(
      owner,
      erc1155TileFacet,
      ethers,
      network
    );
  }

  let baseUri = await erc1155TileFacet.uri("1");
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
