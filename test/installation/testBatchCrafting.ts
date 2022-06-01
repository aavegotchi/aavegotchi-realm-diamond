import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import {
  AlchemicaFacet,
  ERC1155Facet,
  ERC1155FacetTile,
  InstallationAdminFacet,
  InstallationFacet,
  RealmFacet,
  TileFacet,
} from "../../typechain";
import {
  maticInstallationDiamondAddress,
  maticTileDiamondAddress,
} from "../../constants";
import { upgrade } from "../../scripts/installation/upgrades/upgrade-batchCraft";
import { expect } from "chai";
describe("Testing Equip Installation", async function () {
  const testAddress = "0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce";

  //   let realmFacet: RealmFacet;
  //   let alchemicaFacet: AlchemicaFacet;
  let installationFacet: InstallationFacet;
  let tileFacet: TileFacet;
  let ERC1155: ERC1155Facet;
  let tileERC1155: ERC1155FacetTile;

  //   const genSignature = async (tileId: number, x: number, y: number) => {
  //     //@ts-ignore
  //     let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

  //     let messageHash1 = ethers.utils.solidityKeccak256(
  //       ["uint256", "uint256", "uint256", "uint256"],
  //       [0, tileId, x, y]
  //     );
  //     let signedMessage1 = await backendSigner.signMessage(
  //       ethers.utils.arrayify(messageHash1)
  //     );
  //     let signature1 = ethers.utils.arrayify(signedMessage1);

  //     return signature1;
  //   };

  before(async function () {
    this.timeout(20000000);

    tileFacet = (await ethers.getContractAt(
      "TileFacet",
      maticTileDiamondAddress
    )) as TileFacet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      maticInstallationDiamondAddress
    )) as InstallationFacet;

    ERC1155 = (await ethers.getContractAt(
      "ERC1155Facet",
      maticInstallationDiamondAddress
    )) as ERC1155Facet;

    tileERC1155 = (await ethers.getContractAt(
      "ERC1155FacetTile",
      maticTileDiamondAddress
    )) as ERC1155Facet;
    //  await upgrade();
  });
  it("Batch craft both types of installations ", async function () {
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    //craft an aaltar---0 craft time
    //craft a tile --- 0 craft time
    const aaltarBalanceBefore = await ERC1155.balanceOf(testAddress, 10);
    //should revert while trying to craft an installation that does not exist
    await expect(
      installationFacet.batchCraftInstallations([10000, 10000], [2, 2], [0, 0])
    ).to.be.revertedWith("InstallationFacet: Installation does not exist");

    //attempting to craft a lvl2 installation
    await expect(
      installationFacet.batchCraftInstallations([11, 11], [2, 2], [0, 0])
    ).to.be.revertedWith("InstallationFacet: can only craft level 1");

    //should revert while trying to craft a deprecated installation
    await expect(
      installationFacet.batchCraftInstallations([0, 0], [2, 2], [0, 0])
    ).to.be.revertedWith("InstallationFacet: Installation has been deprecated");

    await installationFacet.batchCraftInstallations([10, 10], [2, 2], [0, 0]);
    const aaltarBalanceAfter = await ERC1155.balanceOf(testAddress, 10);
    expect(aaltarBalanceAfter).to.be.equal(aaltarBalanceBefore.add(4));

    //TILES
    const tileBalanceBefore = await tileERC1155.balanceOf(testAddress, 3);
    //should revert while trying to craft a tile that does not exist
    await expect(
      tileFacet.batchCraftTiles([10000, 10000], [2, 2])
    ).to.be.revertedWith("TileFacet: Tile does not exist");

    //should revert while trying to craft a deprecated tile
    await expect(tileFacet.batchCraftTiles([1, 1], [2, 2])).to.be.revertedWith(
      "TileFacet: Tile has been deprecated"
    );

    // await tileFacet.batchCraftTiles([3], [1]);
    // const tileBalanceAfter = await tileERC1155.balanceOf(testAddress, 3);
    // expect(tileBalanceAfter).to.be.equal(aaltarBalanceBefore.add(1));
  });
});
