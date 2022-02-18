import {
  impersonate,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { TestBeforeVars } from "../../types";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import { beforeTest, testTiles } from "../../scripts/realm/realmHelpers";

describe("Testing Tiles", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers);
  });
  it("Deploy alchemica ERC20s", async function () {
    g.alchemicaFacet = await impersonate(
      g.ownerAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    await g.alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      g.installationsAddress,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [g.fud.address, g.fomo.address, g.alpha.address, g.kek.address],
      g.glmr.address,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      g.ownerAddress,
      g.tileAddress
    );
    await network.provider.send("hardhat_setBalance", [
      maticDiamondAddress,
      "0x1000000000000000",
    ]);
  });
  it("Setup tile diamond", async function () {
    g.tileDiamond = await impersonate(
      g.tileOwner,
      g.tileDiamond,
      ethers,
      network
    );

    let tilesTypes = await g.tileDiamond.getTileTypes([]);

    await g.tileDiamond.addTileTypes(testTiles());
    tilesTypes = await g.tileDiamond.getTileTypes([]);
    expect(tilesTypes.length).to.equal(testTiles().length);
  });
  it("Craft tiles", async function () {
    g.tileDiamond = await impersonate(
      testAddress,
      g.tileDiamond,
      ethers,
      network
    );
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    await expect(g.tileDiamond.craftTiles([1, 2, 2])).to.be.revertedWith(
      "ERC20: transfer amount exceeds balance"
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      0,
      ethers.utils.parseUnits("30000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      1,
      ethers.utils.parseUnits("30000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      2,
      ethers.utils.parseUnits("30000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      3,
      ethers.utils.parseUnits("30000")
    );
    g.fud = await impersonate(testAddress, g.fud, ethers, network);
    g.fomo = await impersonate(testAddress, g.fomo, ethers, network);
    g.alpha = await impersonate(testAddress, g.alpha, ethers, network);
    g.kek = await impersonate(testAddress, g.kek, ethers, network);
    g.fud.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    g.fomo.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    g.alpha.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    g.kek.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    await g.fud.approve(g.tileAddress, ethers.utils.parseUnits("1000000000"));
    await g.fomo.approve(g.tileAddress, ethers.utils.parseUnits("1000000000"));
    await g.alpha.approve(g.tileAddress, ethers.utils.parseUnits("1000000000"));
    await g.kek.approve(g.tileAddress, ethers.utils.parseUnits("1000000000"));
    let fudPreCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraft = await g.kek.balanceOf(maticDiamondAddress);
    await g.tileDiamond.craftTiles([1, 2, 2, 3]);
    let fudAfterCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekAfterCraft = await g.kek.balanceOf(maticDiamondAddress);
    expect(Number(ethers.utils.formatUnits(fudAfterCraft))).to.above(
      Number(ethers.utils.formatUnits(fudPreCraft))
    );
    expect(Number(ethers.utils.formatUnits(kekAfterCraft))).to.above(
      Number(ethers.utils.formatUnits(kekPreCraft))
    );
    await expect(g.tileDiamond.claimTiles([0])).to.be.revertedWith(
      "TileFacet: tile not ready"
    );

    g.glmr = await impersonate(testAddress, g.glmr, ethers, network);
    await g.glmr.mint(ethers.utils.parseUnits("100000"));
    await g.glmr.approve(
      g.tileDiamond.address,
      ethers.utils.parseUnits("100000")
    );
    await g.tileDiamond.reduceCraftTime([0], [100]);
    await expect(g.tileDiamond.claimTiles([0])).to.be.revertedWith(
      "TileFacet: tile not ready"
    );
    await g.tileDiamond.reduceCraftTime([0], [10000]);
    await g.tileDiamond.claimTiles([0]);
    for (let i = 0; i < 21000; i++) {
      ethers.provider.send("evm_mine", []);
    }

    const erc1155facet = await ethers.getContractAt(
      "ERC1155FacetTile",
      g.tileAddress
    );

    const balancePre = await erc1155facet.balanceOf(testAddress, 2);
    await g.tileDiamond.claimTiles([1, 2]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);
  });
  it("Survey Parcel", async function () {
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Equip tiles", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipTile(testParcelId, 1, 0, 0);
    await expect(
      g.realmFacet.equipTile(testParcelId, 2, 1, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipTile(testParcelId, 2, 100, 0)
    ).to.be.revertedWith("LibRealm: x exceeding width");
    await expect(
      g.realmFacet.equipTile(testParcelId, 2, 0, 100)
    ).to.be.revertedWith("LibRealm: y exceeding height");
    await g.realmFacet.equipTile(testParcelId, 2, 3, 3);
  });

  it("Test unequipping", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await expect(
      g.realmFacet.unequipTile(testParcelId, 1, 3, 3)
    ).to.be.revertedWith("LibRealm: wrong tileId");
    await g.realmFacet.unequipTile(testParcelId, 1, 0, 0);
    await expect(
      g.realmFacet.unequipTile(testParcelId, 1, 0, 0)
    ).to.be.revertedWith("LibRealm: wrong tileId");
    await g.realmFacet.unequipTile(testParcelId, 2, 3, 3);
  });
});
