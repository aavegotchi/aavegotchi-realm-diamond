import {
  aavegotchiDAOAddress,
  impersonate,
  maticDiamondAddress,
  mineBlocks,
  pixelcraftAddress,
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

  const genSignature = async (tileId: number, x: number, y: number) => {
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    let messageHash1 = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256", "uint256"],
      [testParcelId, tileId, x, y]
    );
    let signedMessage1 = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash1)
    );
    let signature1 = ethers.utils.arrayify(signedMessage1);

    return signature1;
  };

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, maticDiamondAddress);
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
      g.gltr.address,
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
      "ERC20: insufficient allowance"
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
    let fudPreCraftPortal = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraftPortal = await g.kek.balanceOf(maticDiamondAddress);
    let fudPreCraftPixelCraft = await g.fud.balanceOf(pixelcraftAddress);
    let kekPreCraftPixelCraft = await g.kek.balanceOf(pixelcraftAddress);
    let fudPreCraftDAO = await g.fud.balanceOf(aavegotchiDAOAddress);
    let kekPreCraftDAO = await g.kek.balanceOf(aavegotchiDAOAddress);
    await g.tileDiamond.craftTiles([1, 2, 2, 3]);
    let fudAfterCraftPortal = await g.fud.balanceOf(maticDiamondAddress);
    let kekAfterCraftPortal = await g.kek.balanceOf(maticDiamondAddress);
    let fudAfterCraftPixelCraft = await g.fud.balanceOf(pixelcraftAddress);
    let kekAfterCraftPixelCraft = await g.kek.balanceOf(pixelcraftAddress);
    let fudAfterCraftDAO = await g.fud.balanceOf(aavegotchiDAOAddress);
    let kekAfterCraftDAO = await g.kek.balanceOf(aavegotchiDAOAddress);
    expect(Number(ethers.utils.formatUnits(fudAfterCraftPortal))).to.above(
      Number(ethers.utils.formatUnits(fudPreCraftPortal))
    );
    expect(Number(ethers.utils.formatUnits(kekAfterCraftPortal))).to.above(
      Number(ethers.utils.formatUnits(kekPreCraftPortal))
    );
    expect(Number(ethers.utils.formatUnits(fudAfterCraftPixelCraft))).to.above(
      Number(ethers.utils.formatUnits(fudPreCraftPixelCraft))
    );
    expect(Number(ethers.utils.formatUnits(kekAfterCraftPixelCraft))).to.above(
      Number(ethers.utils.formatUnits(kekPreCraftPixelCraft))
    );
    expect(Number(ethers.utils.formatUnits(fudAfterCraftDAO))).to.above(
      Number(ethers.utils.formatUnits(fudPreCraftDAO))
    );
    expect(Number(ethers.utils.formatUnits(kekAfterCraftDAO))).to.above(
      Number(ethers.utils.formatUnits(kekPreCraftDAO))
    );
    await expect(g.tileDiamond.claimTiles([0])).to.be.revertedWith(
      "TileFacet: tile not ready"
    );

    g.gltr = await impersonate(testAddress, g.gltr, ethers, network);
    await g.gltr.mint(ethers.utils.parseUnits("100000"));
    await g.gltr.approve(
      g.tileDiamond.address,
      ethers.utils.parseUnits("100000")
    );
    await g.tileDiamond.reduceCraftTime([0], [100]);
    await expect(g.tileDiamond.claimTiles([0])).to.be.revertedWith(
      "TileFacet: tile not ready"
    );
    await g.tileDiamond.reduceCraftTime([0], [10000]);
    await g.tileDiamond.claimTiles([0]);

    await mineBlocks(ethers, 21000);

    const erc1155facet = await ethers.getContractAt(
      "ERC1155FacetTile",
      g.tileAddress
    );

    const balancePre = await erc1155facet.balanceOf(testAddress, 2);
    await g.tileDiamond.claimTiles([1, 2]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);
  });
  it("Equip tiles", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );

    await expect(
      g.realmFacet.equipTile(testParcelId, 1, 0, 0, await genSignature(1, 0, 1))
    ).to.be.revertedWith("RealmFacet: Invalid signature");
    await g.realmFacet.equipTile(
      testParcelId,
      1,
      0,
      0,
      await genSignature(1, 0, 0)
    );
    await expect(
      g.realmFacet.equipTile(testParcelId, 2, 1, 1, await genSignature(2, 1, 1))
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipTile(
        testParcelId,
        2,
        100,
        0,
        await genSignature(2, 100, 0)
      )
    ).to.be.revertedWith("LibRealm: x exceeding width");
    await expect(
      g.realmFacet.equipTile(
        testParcelId,
        2,
        0,
        100,
        await genSignature(2, 0, 100)
      )
    ).to.be.revertedWith("LibRealm: y exceeding height");
    await g.realmFacet.equipTile(
      testParcelId,
      2,
      3,
      3,
      await genSignature(2, 3, 3)
    );
  });

  it("Test unequipping", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await expect(
      g.realmFacet.unequipTile(
        testParcelId,
        1,
        3,
        3,
        await genSignature(1, 3, 3)
      )
    ).to.be.revertedWith("LibRealm: wrong tileId");
    const balancePre = await g.erc1155FacetTile.balanceOf(testAddress, 1);
    await g.realmFacet.unequipTile(
      testParcelId,
      1,
      0,
      0,
      await genSignature(1, 0, 0)
    );
    const balancePost = await g.erc1155FacetTile.balanceOf(testAddress, 1);
    expect(Number(ethers.utils.formatUnits(balancePost))).to.above(
      Number(ethers.utils.formatUnits(balancePre))
    );
    await expect(
      g.realmFacet.unequipTile(
        testParcelId,
        1,
        0,
        0,
        await genSignature(1, 0, 0)
      )
    ).to.be.revertedWith("LibRealm: wrong tileId");
    await g.realmFacet.unequipTile(
      testParcelId,
      2,
      3,
      3,
      await genSignature(2, 3, 3)
    );
  });
});
