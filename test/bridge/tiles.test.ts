import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "../../scripts/deployAll";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  TilesBridgeGotchichainSide,
  TilesBridgePolygonSide,
  TilesPolygonXGotchichainBridgeFacet,
  AlchemicaToken,
  ERC1155TileFacet,
  TileDiamond,
  TileFacet,
} from "../../typechain-types";
import { outputTile } from "../../scripts/realm/realmHelpers";
import { TileTypeInput } from "../../types";

describe("Tiles Bridge", async function () {
  const chainId_A = 1;
  const chainId_B = 2;
  const defaultAdapterParams = ethers.utils.solidityPack(
    ["uint16", "uint256"],
    [1, "350000"]
  );
  let LZEndpointMock: any,
    bridgePolygonSide: TilesBridgePolygonSide,
    bridgeGotchichainSide: TilesBridgeGotchichainSide;
  let lzEndpointMockA: any, lzEndpointMockB: any;

  let tileFacetPolygon: TileFacet, tileFacetGotchichain: TileFacet;
  let erc1155FacetPolygon: ERC1155TileFacet,
    erc1155FacetGotchichain: ERC1155TileFacet;
  let tilesDiamondPolygon: TileDiamond, tilesDiamondGotchichain: TileDiamond;
  let tilesPolygonBridgeFacet: TilesPolygonXGotchichainBridgeFacet;
  let tilesGotchichainBridgeFacet: TilesPolygonXGotchichainBridgeFacet;
  let alchemicaPolygon, alchemicaGotchichain;
  let deployer: SignerWithAddress;
  let realmDiamondPolygon, realmDiamondGotchichain;

  async function deployFixture() {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];

    ({
      tileDiamond: tilesDiamondPolygon,
      alchemica: alchemicaPolygon,
      realmDiamond: realmDiamondPolygon,
    } = await deploy());
    delete alchemicaPolygon["gltr"];
    const alchemicaWithoutGLTRPolygon = Object.values(alchemicaPolygon);
    ({
      tileDiamond: tilesDiamondGotchichain,
      alchemica: alchemicaGotchichain,
      realmDiamond: realmDiamondGotchichain,
    } = await deploy());
    delete alchemicaGotchichain["gltr"];
    const alchemicaWithoutGLTRGotchichain = Object.values(alchemicaGotchichain);

    erc1155FacetPolygon = await ethers.getContractAt(
      "ERC1155TileFacet",
      tilesDiamondPolygon.address
    );

    erc1155FacetGotchichain = await ethers.getContractAt(
      "ERC1155TileFacet",
      tilesDiamondGotchichain.address
    );

    tileFacetPolygon = await ethers.getContractAt(
      "TileFacet",
      tilesDiamondPolygon.address
    );

    tileFacetGotchichain = await ethers.getContractAt(
      "TileFacet",
      tilesDiamondGotchichain.address
    );

    tilesPolygonBridgeFacet = await ethers.getContractAt(
      "TilesPolygonXGotchichainBridgeFacet",
      tilesDiamondPolygon.address
    );

    tilesGotchichainBridgeFacet = await ethers.getContractAt(
      "TilesPolygonXGotchichainBridgeFacet",
      tilesDiamondGotchichain.address
    );

    LZEndpointMock = await ethers.getContractFactory(
      LZEndpointMockCompiled.abi,
      LZEndpointMockCompiled.bytecode
    );
    const BridgePolygonSide = await ethers.getContractFactory(
      "TilesBridgePolygonSide"
    );
    const BridgeGotchichainSide = await ethers.getContractFactory(
      "TilesBridgeGotchichainSide"
    );

    //Deploying LZEndpointMock contracts
    lzEndpointMockA = await LZEndpointMock.deploy(chainId_A);
    lzEndpointMockB = await LZEndpointMock.deploy(chainId_B);

    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(
      lzEndpointMockA.address,
      tilesDiamondPolygon.address
    );
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
      lzEndpointMockB.address,
      tilesDiamondGotchichain.address
    );

    lzEndpointMockA.setDestLzEndpoint(
      bridgeGotchichainSide.address,
      lzEndpointMockB.address
    );
    lzEndpointMockB.setDestLzEndpoint(
      bridgePolygonSide.address,
      lzEndpointMockA.address
    );

    //Set custom adapter params for both bridges
    await bridgePolygonSide.setUseCustomAdapterParams(true);
    await bridgeGotchichainSide.setUseCustomAdapterParams(true);

    //Set each contracts source address so it can send to each other
    await bridgePolygonSide.setTrustedRemote(
      chainId_B,
      ethers.utils.solidityPack(
        ["address", "address"],
        [bridgeGotchichainSide.address, bridgePolygonSide.address]
      )
    );
    await bridgeGotchichainSide.setTrustedRemote(
      chainId_A,
      ethers.utils.solidityPack(
        ["address", "address"],
        [bridgePolygonSide.address, bridgeGotchichainSide.address]
      )
    );

    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 150000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 150000);
    await bridgePolygonSide.setMinDstGas(chainId_B, 2, 150000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 2, 150000);

    //Set layer zero bridge on facet
    await tileFacetPolygon
      .connect(deployer)
      .setLayerZeroBridgeAddress(bridgePolygonSide.address);
    await tileFacetGotchichain
      .connect(deployer)
      .setLayerZeroBridgeAddress(bridgeGotchichainSide.address);

    //Alchemica
    await faucetRealAlchemica(
      deployer.address,
      ethers,
      alchemicaWithoutGLTRPolygon,
      realmDiamondPolygon.address
    );
    await faucetRealAlchemica(
      deployer.address,
      ethers,
      alchemicaWithoutGLTRGotchichain,
      realmDiamondGotchichain.address
    );

    await approveRealAlchemica(
      tilesDiamondPolygon.address,
      ethers,
      alchemicaWithoutGLTRPolygon
    );
    await approveRealAlchemica(
      tilesDiamondGotchichain.address,
      ethers,
      alchemicaWithoutGLTRGotchichain
    );

    const customTiles: TileTypeInput[] = [
      {
        id: 38,
        name: "The Void",
        width: 1,
        height: 1,
        deprecated: false,
        tileType: 0,
        alchemicaCost: [0, 0, 0, 0],
        craftTime: 0,
      },
      {
        id: 39,
        name: "LE Golden Tile - Gotchiverse",
        width: 8,
        height: 8,
        deprecated: false,
        tileType: 0,
        alchemicaCost: [25, 25, 75, 25],
        craftTime: 0,
      },
    ];

    const tx = await tileFacetPolygon.addTileTypes(
      customTiles.map((val) => outputTile(val))
    );
    await tx.wait();

    const tx2 = await tileFacetGotchichain.addTileTypes(
      customTiles.map((val) => outputTile(val))
    );
    await tx2.wait();
  }

  beforeEach(async function () {
    await loadFixture(deployFixture);
  });

  it("Craft one Tile with ID=38 on Polygon and bridge it to gotchichain", async () => {
    const tileId = 38;
    const balancePre = await erc1155FacetPolygon.balanceOf(
      deployer.address,
      tileId
    );
    await tileFacetPolygon.craftTiles([tileId]);
    const balancePost = await erc1155FacetPolygon.balanceOf(
      deployer.address,
      tileId
    );

    expect(balancePost).to.gt(balancePre);

    await erc1155FacetPolygon.setApprovalForAll(
      bridgePolygonSide.address,
      true
    );
    let sendFromTx = await bridgePolygonSide.sendFrom(
      deployer.address,
      chainId_B,
      deployer.address,
      tileId,
      1,
      deployer.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      {
        value: (
          await bridgePolygonSide.estimateSendFee(
            chainId_B,
            deployer.address,
            tileId,
            1,
            false,
            defaultAdapterParams
          )
        ).nativeFee,
      }
    );
    await sendFromTx.wait();

    expect(
      await erc1155FacetPolygon.balanceOf(deployer.address, tileId)
    ).to.be.equal(ethers.BigNumber.from(0));
    expect(
      await erc1155FacetGotchichain.balanceOf(deployer.address, tileId)
    ).to.be.equal(ethers.BigNumber.from(1));
  });

  it("Craft one Tile with ID=38 on Gotchichain and bridge it to gotchichain and not be able to bridge it back", async () => {
    const tileId = 38;
    const balancePre = await erc1155FacetGotchichain.balanceOf(
      deployer.address,
      tileId
    );
    await tileFacetGotchichain.craftTiles([tileId]);

    const balancePost = await erc1155FacetGotchichain.balanceOf(
      deployer.address,
      tileId
    );
    expect(balancePost).to.gt(balancePre);

    await erc1155FacetGotchichain.setApprovalForAll(
      bridgeGotchichainSide.address,
      true
    );

    await expect(
      bridgeGotchichainSide.sendFrom(
        deployer.address,
        chainId_A,
        deployer.address,
        tileId,
        1,
        deployer.address,
        ethers.constants.AddressZero,
        defaultAdapterParams,
        {
          value: (
            await bridgeGotchichainSide.estimateSendFee(
              chainId_A,
              deployer.address,
              tileId,
              1,
              false,
              defaultAdapterParams
            )
          ).nativeFee,
        }
      )
    ).to.be.revertedWith(
      "TilesBridgeGotchichainSide: not able to bridge it back"
    );
  });

  it("Batch: Craft one Tile with ID=38 and one ID=39 on Polygon and bridge it to gotchichain", async () => {
    const tokenIds = [38, 39];
    const amounts = [1, 1];

    await tileFacetPolygon.craftTiles([tokenIds[0]]);
    await tileFacetPolygon.craftTiles([tokenIds[1]]);

    await erc1155FacetPolygon.setApprovalForAll(
      bridgePolygonSide.address,
      true
    );

    await bridgePolygonSide.sendBatchFrom(
      deployer.address,
      chainId_B,
      deployer.address,
      tokenIds,
      amounts,
      deployer.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      {
        value: (
          await bridgePolygonSide.estimateSendBatchFee(
            chainId_B,
            deployer.address,
            tokenIds,
            amounts,
            false,
            defaultAdapterParams
          )
        ).nativeFee,
      }
    );

    expect(
      await erc1155FacetPolygon.balanceOf(deployer.address, tokenIds[0])
    ).to.be.equal(ethers.BigNumber.from(0));
    expect(
      await erc1155FacetPolygon.balanceOf(deployer.address, tokenIds[1])
    ).to.be.equal(ethers.BigNumber.from(0));
    expect(
      await erc1155FacetGotchichain.balanceOf(deployer.address, tokenIds[0])
    ).to.be.equal(ethers.BigNumber.from(1));
    expect(
      await erc1155FacetGotchichain.balanceOf(deployer.address, tokenIds[1])
    ).to.be.equal(ethers.BigNumber.from(1));
  });

  it("Only owner can set layerzero bridge", async () => {
    const accounts = await ethers.getSigners();
    const bob = accounts[1];
    await expect(
      tileFacetPolygon
        .connect(bob)
        .setLayerZeroBridgeAddress(bridgeGotchichainSide.address)
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });

  it("Only layerzero can call removeItemsFromOwner and addItemsToOwner", async () => {
    const accounts = await ethers.getSigners();
    const bob = accounts[1];
    await expect(
      tilesGotchichainBridgeFacet
        .connect(bob)
        .removeItemsFromOwner(bob.address, [1], [1])
    ).to.be.revertedWith(
      "LibDiamond: Only layerzero bridge"
    );

    await expect(
      tilesGotchichainBridgeFacet
        .connect(bob)
        .addItemsToOwner(bob.address, [1], [1])
    ).to.be.revertedWith(
      "LibDiamond: Only layerzero bridge"
    );
  });
});

const approveRealAlchemica = async (
  TileAddress: string,
  ethers: any,
  alchemica: any[]
) => {
  for (const token of alchemica) {
    let contract = (await ethers.getContractAt(
      "AlchemicaToken",
      token.address
    )) as AlchemicaToken;
    await contract.approve(TileAddress, ethers.utils.parseUnits("1000000000"));
  }
};

const faucetRealAlchemica = async (
  receiver: string,
  ethers: any,
  alchemica: any[],
  realmDiamondOwner: string
) => {
  for (const token of alchemica) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [realmDiamondOwner],
    });
    const signer = await ethers.getSigner(realmDiamondOwner);
    await network.provider.request({
      method: "hardhat_setBalance",
      params: [realmDiamondOwner, "0x1000000000000000"],
    });
    const contract = (await ethers.getContractAt(
      "AlchemicaToken",
      token.address
    )) as AlchemicaToken;
    await contract
      .connect(signer)
      .mint(receiver, ethers.utils.parseEther("10000"));
  }
};
