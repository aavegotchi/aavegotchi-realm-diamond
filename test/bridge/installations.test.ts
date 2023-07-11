import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "../../scripts/deployAll";
import {
  AlchemicaToken,
  ERC1155Facet,
  InstallationDiamond,
  InstallationFacet,
  InstallationsBridgeGotchichainSide,
  InstallationsBridgePolygonSide,
  InstallationsPolygonXGotchichainBridgeFacet,
} from "../../typechain-types";

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
    await installationFacetPolygon
      .connect(deployer)
      .setLayerZeroBridgeAddress(bridgePolygonSide.address);
    await installationFacetGotchichain
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

  it("Craft one installation with ID=0 on Polygon and bridge it to gotchichain", async () => {
    const installationId = 10;
    const balancePre = await erc1155FacetPolygon.balanceOf(
      deployer.address,
      installationId
    );
    await installationFacetPolygon.craftInstallations([installationId], [0]);

    const balancePost = await erc1155FacetPolygon.balanceOf(
      deployer.address,
      installationId
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
      installationId,
      1,
      deployer.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      {
        value: (
          await bridgePolygonSide.estimateSendFee(
            chainId_B,
            deployer.address,
            installationId,
            1,
            false,
            defaultAdapterParams
          )
        ).nativeFee,
      }
    );
    await sendFromTx.wait();

    expect(
      await erc1155FacetPolygon.balanceOf(deployer.address, installationId)
    ).to.be.equal(ethers.BigNumber.from(0));
    expect(
      await erc1155FacetGotchichain.balanceOf(deployer.address, installationId)
    ).to.be.equal(ethers.BigNumber.from(1));
  });

  it("Craft one installation with ID=0 on Gotchichain and bridge it to gotchichain and not be able to bridge it back", async () => {
    const installationId = 10;
    const balancePre = await erc1155FacetGotchichain.balanceOf(
      deployer.address,
      installationId
    );
    await installationFacetGotchichain.craftInstallations(
      [installationId],
      [0]
    );

    const balancePost = await erc1155FacetGotchichain.balanceOf(
      deployer.address,
      installationId
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
        installationId,
        1,
        deployer.address,
        ethers.constants.AddressZero,
        defaultAdapterParams,
        {
          value: (
            await bridgeGotchichainSide.estimateSendFee(
              chainId_A,
              deployer.address,
              installationId,
              1,
              false,
              defaultAdapterParams
            )
          ).nativeFee,
        }
      )
    ).to.be.revertedWith(
      "InstallationsBridgeGotchichainSide: not able to bridge it back"
    );
  });

  it("Batch: Craft one installation with ID=0 and one ID=1 on Polygon and bridge it to gotchichain", async () => {
    const tokenIds = [10, 55];
    const amounts = [1, 1];

    await installationFacetPolygon.craftInstallations([tokenIds[0]], [0]);
    await installationFacetPolygon.craftInstallations([tokenIds[1]], [0]);

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
      installationFacetPolygon
        .connect(bob)
        .setLayerZeroBridgeAddress(bridgeGotchichainSide.address)
    ).to.be.revertedWith("LibDiamond: Must be contract owner");
  });

  it("Only layerzero can call removeItemsFromOwner and addItemsToOwner", async () => {
    const accounts = await ethers.getSigners();
    const bob = accounts[1];
    await expect(
      installationsGotchichainBridgeFacet
        .connect(bob)
        .removeItemsFromOwner(bob.address, [1], [1])
    ).to.be.revertedWith(
      "LibDiamond: Only layerzero bridge"
    );

    await expect(
      installationsGotchichainBridgeFacet
        .connect(bob)
        .addItemsToOwner(bob.address, [1], [1])
    ).to.be.revertedWith(
      "LibDiamond: Only layerzero bridge"
    );
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
