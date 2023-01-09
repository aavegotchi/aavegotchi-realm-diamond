import { ethers, network } from "hardhat";
import { installationTypes } from "../../../data/installations/xmas";
import {
  ERC1155Facet,
  InstallationAdminFacet,
  InstallationFacet,
} from "../../../typechain";

import { LedgerSigner } from "@anders-t/ethers-ledger";
import { outputInstallation } from "../../realm/realmHelpers";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";

export async function addDecorations() {
  // let signer = await ethers.getSigners()[0];

  // console.log("signer:", signer);

  const c = await varsForNetwork(ethers);
  const itemManager = "0x8D46fd7160940d89dA026D59B2e819208E714E82";

  const testing = ["hardhat", "localhost"].includes(network.name);

  let erc1155Facet = (await ethers.getContractAt(
    "ERC1155Facet",
    c.installationDiamond
  )) as ERC1155Facet;

  if (testing) {
    erc1155Facet = await impersonate(
      itemManager,
      erc1155Facet,
      ethers,
      network
    );
  }

  const addresses = [
    // "0x6c127b8ff818d1bbbf6015c327fde5ca73a78a91",
    // "0x2b29518e5ac3eda4cfc138facd6f023bffc5d65a",
    // "0x6701dc817396c99e40e31f2724ea966e2832492c",
    // "0x84efecb9fd6ad1e9638afe56796fca1f309beb35",
    // "0x5e31c357d03e9528e9bf95bd16e5c1ab3f7d37d0",
    "0xb652158f67b9fb39c29412d6f8e1c563ff6724f2",
    "0xd7fd128a2fd1382fb286cb82b756f7b0e983b5a1",
    "0xc4cb6cb969e8b4e309ab98e4da51b77887afad96",
    "0x501ffc7ee44f7986c24fb5bf7c04c1ed6377ec87",
    "0x3621fd0db8dabc21d522851de01114cf82b7c21f",
    "0xc0719b1040f7f8e904a6509f99335656c1d881ed",
    "0x2b29518e5ac3eda4cfc138facd6f023bffc5d65a",
    "0x47d6f96ba098816389db7c87cbf077de7181b853",
    "0x984c48852f92288bd1afd6ff5d9c26e3d0a9339a",
    "0xfdf7fb637a50192bc9016e6156babb3f9004ef9b",
    "0x09a1a849974d021a0f74366e5020884ff73e3abb",
    "0x870c597d1b52dfc977169778a591f1170b3a2338",
    "0xbdc7a955505e20410061744f556f6dec761bfb8f",
    "0x47d6f96ba098816389db7c87cbf077de7181b853",
    "0x3aef590df6febaa81477c1cea3009bb9e096730c",
    "0x180f207f8747a966ec94277a69610162d7fa3ff1",
    "0x2bd7716ce2c43b9c0d58982f5bac67633bf2e7dc",
    "0x2bd7716ce2c43b9c0d58982f5bac67633bf2e7dc",
    "0x6701dc817396c99e40e31f2724ea966e2832492c",
    "0xe3570b119b995d087bacb2390ae98d9e45a8c59f",
  ];

  // console.log("signer:", await signer);

  let bal = await erc1155Facet.balanceOf(itemManager, 156);
  console.log("item manager balance:", bal.toString());

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];

    console.log("transferring to", address, i);

    const tx = await erc1155Facet.safeBatchTransferFrom(
      itemManager,
      address,
      [156],
      [1],
      [],
      { gasPrice: gasPrice }
    );
    await tx.wait();

    const bal = await erc1155Facet.balanceOf(address, 156);
    console.log("bal:", bal.toString());
  }

  bal = await erc1155Facet.balanceOf(itemManager, 156);
  console.log("item manager balance:", bal.toString());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addDecorations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
