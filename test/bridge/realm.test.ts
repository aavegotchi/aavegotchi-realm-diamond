import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "../../scripts/deployAll";
import { mineBlocks } from "../../scripts/helperFunctions";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AlchemicaToken,
  ERC1155Facet,
  InstallationDiamond,
  InstallationFacet,
} from "../../typechain";
import {
  ERC721Facet,
  InstallationsBridgeGotchichainSide,
  InstallationsBridgePolygonSide,
  InstallationsPolygonXGotchichainBridgeFacet,
  RealmFacet,
} from "../../typechain-types";
import { MintParcelInput } from "../../types";

describe("Installation Bridge", async function () {
  const chainId_A = 1;
  const chainId_B = 2;
  const defaultAdapterParams = ethers.utils.solidityPack(
    ["uint16", "uint256"],
    [1, "350000"]
  );
  let LZEndpointMock: any,
    bridgePolygonSide: InstallationsBridgePolygonSide,
    bridgeGotchichainSide: InstallationsBridgeGotchichainSide;
  let lzEndpointMockA: any, lzEndpointMockB: any;

  let installationFacetPolygon: InstallationFacet,
    installationFacetGotchichain: InstallationFacet;
  let erc1155FacetPolygon: ERC1155Facet, erc1155FacetGotchichain: ERC1155Facet;
  let realmFacetPolygon: RealmFacet, realmFacetGotchichain: RealmFacet;
  let erc721FacetPolygon: ERC721Facet, erc721FacetGotchichain: ERC721Facet;
  let installationsDiamondPolygon: InstallationDiamond,
    installationsDiamondGotchichain: InstallationDiamond;
  let installationsPolygonBridgeFacet: InstallationsPolygonXGotchichainBridgeFacet;
  let installationsGotchichainBridgeFacet: InstallationsPolygonXGotchichainBridgeFacet;
  let alchemicaPolygon, alchemicaGotchichain;
  let deployer: SignerWithAddress;
  let realmDiamondPolygon, realmDiamondGotchichain;

  async function deployFixture() {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];

    ({
      installationDiamond: installationsDiamondPolygon,
      alchemica: alchemicaPolygon,
      realmDiamond: realmDiamondPolygon,
    } = await deploy());
    delete alchemicaPolygon["gltr"];
    const alchemicaWithoutGLTRPolygon = Object.values(alchemicaPolygon);
    ({
      installationDiamond: installationsDiamondGotchichain,
      alchemica: alchemicaGotchichain,
      realmDiamond: realmDiamondGotchichain,
    } = await deploy());
    delete alchemicaGotchichain["gltr"];
    const alchemicaWithoutGLTRGotchichain = Object.values(alchemicaGotchichain);

    erc1155FacetPolygon = await ethers.getContractAt(
      "ERC1155Facet",
      installationsDiamondPolygon.address
    );

    erc1155FacetGotchichain = await ethers.getContractAt(
      "ERC1155Facet",
      installationsDiamondGotchichain.address
    );

    installationFacetPolygon = await ethers.getContractAt(
      "InstallationFacet",
      installationsDiamondPolygon.address
    );

    installationFacetGotchichain = await ethers.getContractAt(
      "InstallationFacet",
      installationsDiamondGotchichain.address
    );

    installationsPolygonBridgeFacet = await ethers.getContractAt(
      "InstallationsPolygonXGotchichainBridgeFacet",
      installationsDiamondPolygon.address
    );

    installationsGotchichainBridgeFacet = await ethers.getContractAt(
      "InstallationsPolygonXGotchichainBridgeFacet",
      installationsDiamondGotchichain.address
    );

    realmFacetPolygon = await ethers.getContractAt(
      "RealmFacet",
      realmDiamondPolygon.address
    );

    erc721FacetPolygon = await ethers.getContractAt(
      "ERC721Facet",
      realmDiamondPolygon.address
    );

    LZEndpointMock = await ethers.getContractFactory(
      LZEndpointMockCompiled.abi,
      LZEndpointMockCompiled.bytecode
    );
    const BridgePolygonSide = await ethers.getContractFactory(
      "InstallationsBridgePolygonSide"
    );
    const BridgeGotchichainSide = await ethers.getContractFactory(
      "InstallationsBridgeGotchichainSide"
    );

    //Deploying LZEndpointMock contracts
    lzEndpointMockA = await LZEndpointMock.deploy(chainId_A);
    lzEndpointMockB = await LZEndpointMock.deploy(chainId_B);

    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(
      lzEndpointMockA.address,
      installationsDiamondPolygon.address
    );
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
      lzEndpointMockB.address,
      installationsDiamondGotchichain.address
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
    await installationsPolygonBridgeFacet
      .connect(deployer)
      .setLayerZeroBridge(bridgePolygonSide.address);
    await installationsGotchichainBridgeFacet
      .connect(deployer)
      .setLayerZeroBridge(bridgeGotchichainSide.address);

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
      installationsDiamondPolygon.address,
      ethers,
      alchemicaWithoutGLTRPolygon
    );
    await approveRealAlchemica(
      installationsDiamondGotchichain.address,
      ethers,
      alchemicaWithoutGLTRGotchichain
    );
  }

  beforeEach(async function () {
    await loadFixture(deployFixture);
  });

  it("", async () => {
    console.log("FIRST TEST")
    const boostFomo = Math.floor(Math.random() * 4);
    const boostFud = Math.floor(Math.random() * 4);
    const boostKek = Math.floor(Math.random() * 4);
    const boostAlpha = Math.floor(Math.random() * 4);
    const parcelsTest1: MintParcelInput[] = [{
      coordinateX: 0,
      coordinateY: 0,
      parcelId: "0",
      size: Math.floor(Math.random() * 5),
      boost: [boostFud, boostFomo, boostAlpha, boostKek],
      district: 1,
      parcelAddress: "hey-whats-up",
    }];

    console.log(deployer.address)
    await realmFacetPolygon.mintParcels([deployer.address], [5], parcelsTest1);

    console.log(await erc721FacetPolygon.ownerOf(5));
  });
});

const approveRealAlchemica = async (
  installationAddress: string,
  ethers: any,
  alchemica: any[]
) => {
  for (const token of alchemica) {
    let contract = (await ethers.getContractAt(
      "AlchemicaToken",
      token.address
    )) as AlchemicaToken;
    await contract.approve(
      installationAddress,
      ethers.utils.parseUnits("1000000000")
    );
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
