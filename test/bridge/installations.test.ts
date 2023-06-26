import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";
import { RealmFacet, ERC721Facet, OwnershipFacet } from "../typechain";
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
import { MintParcelInput } from "../types";
import { deploy } from "../../scripts/deployAll.ts";

let diamondAddress;
let realmFacet: RealmFacet;
let erc721Facet: ERC721Facet;
let ownershipFacet: OwnershipFacet;
let ownerAddress: string;

describe("Realm Upgrade tests", async function () {
  beforeEach(async function () {
    console.log("before each");
    await deploy();
  });

  it("", async function () {
    
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

    await approveRealAlchemica(testAddress, diamondAddress, ethers);

    await ghst.approve(
      installationFacet.address,
      ethers.utils.parseUnits("1000000000")
    );
    await installationFacet.craftInstallations([0, 0, 0, 0, 0]);
    await expect(installationFacet.claimInstallations([0])).to.be.revertedWith(
      "InstallationFacet: Installation not ready"
    );

    await mineBlocks(ethers, 11000);

    const balancePre = await erc1155Facet.balanceOf(testAddress, 0);
    await installationFacet.claimInstallations([0, 1, 2, 3, 4]);
    const balancePost = await erc1155Facet.balanceOf(testAddress, 0);
    expect(balancePost).to.gt(balancePre);
  });
});
