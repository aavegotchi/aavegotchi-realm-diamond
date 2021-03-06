import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import {
  AlchemicaFacet,
  AlchemicaToken,
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
import { BigNumber } from "ethers";
import {
  ALPHA_ADDRESS,
  FOMO_ADDRESS,
  FUD_ADDRESS,
  KEK_ADDRESS,
} from "../../helpers/constants";
describe("Testing Batch Crafting ", async function () {
  const testAddress = "0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce";

  //   let realmFacet: RealmFacet;
  //   let alchemicaFacet: AlchemicaFacet;
  let installationFacet: InstallationFacet;
  let tileFacet: TileFacet;
  let ERC1155: ERC1155Facet;
  let tileERC1155: ERC1155FacetTile;

  interface TileCraft {
    tileID: number;
    amount: BigNumber;
    gltr: BigNumber;
  }

  interface InstallationCraft {
    installationID: number;
    amount: BigNumber;
    gltr: BigNumber;
  }

  const alchemica = [FUD_ADDRESS, FOMO_ADDRESS, ALPHA_ADDRESS, KEK_ADDRESS];
  // let beforeBalances = [];
  // let afterBalances = [];
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

    await upgrade();
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
    const voidInstallation: InstallationCraft = {
      installationID: 10000,
      amount: BigNumber.from(1),
      gltr: BigNumber.from(1),
    };

    const deprecatedInstallation: InstallationCraft = {
      installationID: 0,
      amount: BigNumber.from(1),
      gltr: BigNumber.from(1),
    };

    const leve2or3Installation: InstallationCraft[] = [
      {
        installationID: 11,
        amount: BigNumber.from(1),
        gltr: BigNumber.from(0),
      },
      {
        installationID: 12,
        amount: BigNumber.from(1),
        gltr: BigNumber.from(0),
      },
    ];
    const level1Aaltar: InstallationCraft[] = [
      {
        installationID: 10,
        amount: BigNumber.from(4),
        gltr: BigNumber.from(0),
      },
    ];

    const deprecatedTile: TileCraft = {
      tileID: 1,
      amount: BigNumber.from(1),
      gltr: BigNumber.from(0),
    };
    const voidTile: TileCraft = {
      tileID: 10000,
      amount: BigNumber.from(1),
      gltr: BigNumber.from(0),
    };

    await expect(
      installationFacet.batchCraftInstallations([voidInstallation])
    ).to.be.revertedWith("InstallationFacet: Installation does not exist");

    //attempting to craft a lvl2 installation
    await expect(
      installationFacet.batchCraftInstallations(leve2or3Installation)
    ).to.be.revertedWith("InstallationFacet: can only craft level 1");

    //should revert while trying to craft a deprecated installation
    await expect(
      installationFacet.batchCraftInstallations([deprecatedInstallation])
    ).to.be.revertedWith("InstallationFacet: Installation has been deprecated");

    //
    await installationFacet.batchCraftInstallations(level1Aaltar);
    const aaltarBalanceAfter = await ERC1155.balanceOf(testAddress, 10);
    expect(aaltarBalanceAfter).to.be.equal(aaltarBalanceBefore.add(4));

    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    //TILES

    async function getBalances(): Promise<BigNumber[]> {
      const output: BigNumber[] = [];
      for await (const alch of alchemica) {
        let token = (await ethers.getContractAt(
          "AlchemicaToken",
          alch
        )) as AlchemicaToken;
        const balanceOfToken = await token.balanceOf(testAddress);
        output.push(balanceOfToken);
      }

      return output;
    }

    const tileBalanceBefore = await tileERC1155.balanceOf(testAddress, 3);
    //should revert while trying to craft a tile that does not exist
    await expect(tileFacet.batchCraftTiles([voidTile])).to.be.revertedWith(
      "TileFacet: Tile does not exist"
    );

    //should revert while trying to craft a deprecated tile
    await expect(
      tileFacet.batchCraftTiles([deprecatedTile])
    ).to.be.revertedWith("TileFacet: Tile has been deprecated");

    const craftTile: TileCraft = {
      tileID: 4,
      amount: BigNumber.from(1),
      gltr: BigNumber.from(0),
    };
    //get Alchemica balances before crafting
    const beforeBalances = await getBalances();

    console.log("before:", beforeBalances);

    const tile4BalanceBefore = await tileERC1155.balanceOf(testAddress, 4);
    await tileFacet.batchCraftTiles([craftTile]);
    const tile4BalanceAfter = await tileERC1155.balanceOf(testAddress, 4);
    expect(tile4BalanceAfter).to.be.equal(tile4BalanceBefore.add(1));

    //get balance after crafting
    const afterBalances = await getBalances();
    console.log("after:", afterBalances);

    //200fud
    expect(beforeBalances[0]).to.equal(
      afterBalances[0].add(ethers.utils.parseEther("200"))
    );

    //0 fomo
    expect(beforeBalances[1]).to.equal(afterBalances[1]);

    //0 alpha
    expect(beforeBalances[2]).to.equal(afterBalances[2]);

    //5 kek
    expect(beforeBalances[3]).to.equal(
      afterBalances[3].add(ethers.utils.parseEther("5"))
    );
  });
});
