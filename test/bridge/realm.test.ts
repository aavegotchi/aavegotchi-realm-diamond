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
  MigrationFacet
} from "../../typechain";
import {
  ERC721Facet,
  RealmsBridgePolygonSide,
  RealmsBridgeGotchichainSide,
  InstallationsPolygonXGotchichainBridgeFacet,
  RealmFacet,
  RealmsPolygonXGotchichainBridgeFacet,
  RealmGridFacet,
} from "../../typechain-types";
import { MintParcelInput } from "../../types";

describe("Realms Bridge", async function () {
  const chainId_A = 1;
  const chainId_B = 2;
  const minGasToStore = 150000
  const defaultAdapterParams = ethers.utils.solidityPack(
    ["uint16", "uint256"],
    [1, "350000"]
  );
  let LZEndpointMock: any,
    bridgePolygonSide: RealmsBridgePolygonSide,
    bridgeGotchichainSide: RealmsBridgeGotchichainSide;
  let lzEndpointMockA: any, lzEndpointMockB: any;

  let installationFacetPolygon: InstallationFacet,
    installationFacetGotchichain: InstallationFacet;
  let erc1155FacetPolygon: ERC1155Facet, erc1155FacetGotchichain: ERC1155Facet;
  let realmGridFacetPolygon: RealmGridFacet;
  let realmFacetPolygon: RealmFacet, realmFacetGotchichain: RealmFacet;
  let erc721FacetPolygon: ERC721Facet, erc721FacetGotchichain: ERC721Facet;
  let migrationFacet: MigrationFacet
  let installationsDiamondPolygon: InstallationDiamond,
    installationsDiamondGotchichain: InstallationDiamond;
  let realmsPolygonBridgeFacet: RealmsPolygonXGotchichainBridgeFacet;
  let realmsGotchichainBridgeFacet: RealmsPolygonXGotchichainBridgeFacet;
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

    realmsPolygonBridgeFacet = await ethers.getContractAt(
      "RealmsPolygonXGotchichainBridgeFacet",
      realmDiamondPolygon.address
    );

    realmsGotchichainBridgeFacet = await ethers.getContractAt(
      "RealmsPolygonXGotchichainBridgeFacet",
      realmDiamondGotchichain.address
    );

    realmFacetPolygon = await ethers.getContractAt(
      "RealmFacet",
      realmDiamondPolygon.address
    );

    realmGridFacetPolygon = await ethers.getContractAt(
      "RealmGridFacet",
      realmDiamondPolygon.address
    );

    realmFacetGotchichain = await ethers.getContractAt(
      "RealmFacet",
      realmDiamondGotchichain.address
    );

    erc721FacetPolygon = await ethers.getContractAt(
      "ERC721Facet",
      realmDiamondPolygon.address
    );

    erc721FacetGotchichain = await ethers.getContractAt(
      "ERC721Facet",
      realmDiamondGotchichain.address
    );

    migrationFacet = await ethers.getContractAt(
      "MigrationFacet",
      realmDiamondPolygon.address
    );

    LZEndpointMock = await ethers.getContractFactory(
      LZEndpointMockCompiled.abi,
      LZEndpointMockCompiled.bytecode
    );

    //Deploying LZEndpointMock contracts
    lzEndpointMockA = await LZEndpointMock.deploy(chainId_A);
    lzEndpointMockB = await LZEndpointMock.deploy(chainId_B);

    const BridgePolygonSide = await ethers.getContractFactory(
      "RealmsBridgePolygonSide"
    );

    const BridgeGotchichainSide = await ethers.getContractFactory(
      "RealmsBridgeGotchichainSide"
    );

    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(minGasToStore, lzEndpointMockA.address, realmFacetPolygon.address)
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(minGasToStore, lzEndpointMockB.address, realmFacetGotchichain.address)

    lzEndpointMockA.setDestLzEndpoint(
      bridgeGotchichainSide.address,
      lzEndpointMockB.address
    );
    lzEndpointMockB.setDestLzEndpoint(
      bridgePolygonSide.address,
      lzEndpointMockA.address
    );
    
    //Set each contracts source address so it can send to each other
    await bridgePolygonSide.setTrustedRemote(chainId_B, ethers.utils.solidityPack(["address", "address"], [bridgeGotchichainSide.address, bridgePolygonSide.address]));
    await bridgeGotchichainSide.setTrustedRemote(chainId_A, ethers.utils.solidityPack(["address", "address"], [bridgePolygonSide.address, bridgeGotchichainSide.address]));

    //Set batch limit
    await bridgePolygonSide.setDstChainIdToBatchLimit(chainId_B, 3)
    await bridgeGotchichainSide.setDstChainIdToBatchLimit(chainId_A, 3)

    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 150000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 150000);

    await bridgePolygonSide.setDstChainIdToTransferGas(chainId_B, 1950000)
    await bridgeGotchichainSide.setDstChainIdToTransferGas(chainId_A, 1950000)

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
    const boostFomo = Math.floor(Math.random() * 4);
    const boostFud = Math.floor(Math.random() * 4);
    const boostKek = Math.floor(Math.random() * 4);
    const boostAlpha = Math.floor(Math.random() * 4);
    const parcelsTest1: MintParcelInput[] = [{
      coordinateX: 0,
      coordinateY: 0,
      parcelId: "",
      size: Math.floor(Math.random() * 5),
      boost: [boostFud, boostFomo, boostAlpha, boostKek],
      district: 1,
      parcelAddress: "hey-whats-up1",
    }];
    const tokenId = 5
    await realmFacetPolygon.mintParcels([deployer.address], [tokenId], parcelsTest1);


    // //Craft and equip installation
    // const installationId = 10;
    // const balancePre = await erc1155FacetPolygon.balanceOf(
    //   deployer.address,
    //   installationId
    // );
    // await installationFacetPolygon.craftInstallations([installationId], [0]);

    // const balancePost = await erc1155FacetPolygon.balanceOf(
    //   deployer.address,
    //   installationId
    // );
    // expect(balancePost).to.gt(balancePre);

    // await realmFacetPolygon.equipInstallation(tokenId, 0, 10, 0, 0, await genSignature(10, 0, 0));

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

const genSignature = async (tileId: number, x: number, y: number) => {
  //@ts-ignore
  let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

  let messageHash1 = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "uint256", "uint256"],
    [0, tileId, x, y]
  );
  let signedMessage1 = await backendSigner.signMessage(
    ethers.utils.arrayify(messageHash1)
  );
  let signature1 = ethers.utils.arrayify(signedMessage1);

  return signature1;
};
