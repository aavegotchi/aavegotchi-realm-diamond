import {
  impersonate,
  mineBlocks,
  // maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { RealmFacet, ERC721Facet } from "../../typechain";
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
import { deploy } from "../../scripts/deployAll";
import { BigNumber } from "ethers";

import {
  InstallationFacet,
  ERC1155Facet,
  IERC20,
  InstallationAdminFacet,
  OwnershipFacet,
} from "../../typechain";
import {
  approveRealAlchemica,
  faucetRealAlchemica,
} from "../../scripts/realm/realmHelpers";

let diamondAddress;
let realmFacet: RealmFacet;
let erc721Facet: ERC721Facet;
let ownershipFacet: OwnershipFacet;
let ownerAddress: string;

describe("Realm Upgrade tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const maticGhstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  let diamondAddress: string;
  let installationFacet: InstallationFacet;
  let installationAdminFacet: InstallationAdminFacet;
  let erc1155Facet: ERC1155Facet;
  let ghst: IERC20;
  let startInstallationId: number;

  beforeEach(async function () {
    console.log("before each");
    diamondAddress = await deploy();

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155Facet",
      diamondAddress
    )) as ERC1155Facet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      diamondAddress
    )) as InstallationFacet;

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;
    console.log("finished before each");
  });

  it("Craft ID=0 installations with Test Address", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );

    await faucetRealAlchemica(testAddress, ethers);
    console.log("fauceted");
    console.log("testAddress:", testAddress);
    console.log("diamondAddress:", diamondAddress);
    await approveRealAlchemica(testAddress, diamondAddress, ethers);
    console.log("approved");

    await ghst.approve(
      installationFacet.address,
      ethers.utils.parseUnits("100000000000000")
    );
    console.log("approved ghst");

    await installationFacet.craftInstallations([0], [0]);
    console.log("crafted");
    // await expect(installationFacet.claimInstallations([0])).to.be.revertedWith(
    //   "InstallationFacet: Installation not ready"
    // );
    console.log("reverted claimed");

    await mineBlocks(ethers, 11000);

    const balancePre = await erc1155Facet.balanceOf(testAddress, 0);
    console.log("balancePre:", balancePre.toString());
    // console.log(await installationFacet.getCraftQueue(testAddress));
    await installationFacet.claimInstallations([0]);
    console.log("claimed");
    const balancePost = await erc1155Facet.balanceOf(testAddress, 0);
    console.log("balancePost:", balancePost.toString());
    expect(balancePost).to.gt(balancePre);
  });
});
