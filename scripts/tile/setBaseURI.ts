import { ethers, network } from "hardhat";

import { ERC1155TileFacet, OwnershipFacet } from "../../typechain";
import { impersonate } from "../helperFunctions";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { gasPrice } from "../../constants";

export async function setAddresses() {
  const diamondAddress = "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355";

  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  const testing = ["hardhat"].includes(network.name);

  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;
  const owner = await ownershipFacet.owner();
  console.log("owner:", owner);

  let erc1155TileFacet = (await ethers.getContractAt(
    "ERC1155TileFacet",
    diamondAddress,
    signer
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

  const tx = await erc1155TileFacet.setBaseURI(
    "https://app.aavegotchi.com/metadata/tile/",
    {
      gasPrice: gasPrice,
    }
  );
  await tx.wait();

  baseUri = await erc1155TileFacet.uri("1");
  console.log("base uri:", baseUri);
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
