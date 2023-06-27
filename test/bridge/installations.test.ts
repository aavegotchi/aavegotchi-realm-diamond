import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "../../scripts/deployAll";
import { mineBlocks } from "../../scripts/helperFunctions";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AlchemicaToken,
  ERC1155Facet,
  IERC20,
  InstallationDiamond,
  InstallationFacet,
} from "../../typechain";
import {
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

  const maticGhstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  let installationFacet: InstallationFacet;
  let erc1155FacetPolygon: ERC1155Facet, erc1155FacetGotchichain: ERC1155Facet;
  let ghst: IERC20;
  let installationsDiamondPolygon: InstallationDiamond,
    installationsDiamondGotchichain: InstallationDiamond;
  let installationsPolygonBridgeFacet: InstallationsPolygonXGotchichainBridgeFacet;
  let installationsGotchichainBridgeFacet: InstallationsPolygonXGotchichainBridgeFacet;
  let alchemicaPolygon, alchemicaGotchichain;
  let deployer: SignerWithAddress;
  let realmDiamondPolygon, realmDiamondGotchichain;

  beforeEach(async function () {
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

    installationFacet = await ethers.getContractAt(
      "InstallationFacet",
      installationsDiamondPolygon.address
    );

    installationsPolygonBridgeFacet = await ethers.getContractAt(
      "InstallationsPolygonXGotchichainBridgeFacet",
      installationsDiamondPolygon.address
    );

    installationsGotchichainBridgeFacet = await ethers.getContractAt(
      "InstallationsPolygonXGotchichainBridgeFacet",
      installationsDiamondGotchichain.address
    );

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;

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
  });

  it("Craft one installation with ID=0 on Polygon and bridge it to gotchichain", async function () {
    await ghst.approve(
      installationFacet.address,
      ethers.utils.parseUnits("100000000000000")
    );

    await installationFacet.craftInstallations([0], [0]);

    await mineBlocks(ethers, 11000);

    const balancePre = await erc1155FacetPolygon.balanceOf(deployer.address, 0);
    await installationFacet.claimInstallations([0]);
    const balancePost = await erc1155FacetPolygon.balanceOf(
      deployer.address,
      0
    );
    expect(balancePost).to.gt(balancePre);

    // const bridgePolygonSideImpersonated = await impersonate(
    //   deployer,
    //   bridgePolygonSide,
    //   ethers,
    //   network
    // );

    // const erc1155FacetPolygonSideImpersonated = await impersonate(
    //   deployer,
    //   erc1155FacetPolygon,
    //   ethers,
    //   network
    // );

    await erc1155FacetPolygon.setApprovalForAll(
      bridgePolygonSide.address,
      true
    );
    let sendFromTx = await bridgePolygonSide.sendFrom(
      deployer.address,
      chainId_B,
      deployer.address,
      0,
      1,
      deployer.address,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      {
        value: (
          await bridgePolygonSide.estimateSendFee(
            chainId_B,
            deployer.address,
            0,
            1,
            false,
            defaultAdapterParams
          )
        ).nativeFee,
      }
    );
    await sendFromTx.wait();

    expect(
      await erc1155FacetPolygon.balanceOf(deployer.address, 0)
    ).to.be.equal(ethers.BigNumber.from(0));
    expect(
      await erc1155FacetGotchichain.balanceOf(deployer.address, 0)
    ).to.be.equal(ethers.BigNumber.from(1));
  });

  // it.skip("Craft one installation with ID=0 on Gotchichain and bridge it to gotchichain and not be able to bridge it back", async function () {
  //   ghst = await impersonate(deployer, ghst, ethers, network);
  //   installationFacet = await impersonate(
  //     deployer,
  //     installationFacet,
  //     ethers,
  //     network
  //   );

  //   await faucetRealAlchemica(deployer, ethers);

  //   await approveRealAlchemica(
  //     deployer,
  //     installationsDiamondPolygon.address,
  //     ethers
  //   );

  //   await ghst.approve(
  //     installationFacet.address,
  //     ethers.utils.parseUnits("100000000000000")
  //   );

  //   await installationFacet.craftInstallations([0], [0]);

  //   await mineBlocks(ethers, 11000);

  //   const balancePre = await erc1155FacetPolygon.balanceOf(deployer, 0);
  //   await installationFacet.claimInstallations([0]);
  //   const balancePost = await erc1155FacetPolygon.balanceOf(deployer, 0);
  //   expect(balancePost).to.gt(balancePre);

  //   const bridgePolygonSideImpersonated = await impersonate(
  //     deployer,
  //     bridgePolygonSide,
  //     ethers,
  //     network
  //   );

  //   const erc1155FacetPolygonSideImpersonated = await impersonate(
  //     deployer,
  //     erc1155FacetPolygon,
  //     ethers,
  //     network
  //   );

  //   await erc1155FacetPolygonSideImpersonated.setApprovalForAll(
  //     bridgePolygonSide.address,
  //     true
  //   );
  //   let sendFromTx = await bridgePolygonSideImpersonated.sendFrom(
  //     deployer,
  //     chainId_B,
  //     deployer,
  //     0,
  //     1,
  //     deployer,
  //     ethers.constants.AddressZero,
  //     defaultAdapterParams,
  //     {
  //       value: (
  //         await bridgePolygonSideImpersonated.estimateSendFee(
  //           chainId_B,
  //           deployer,
  //           0,
  //           1,
  //           false,
  //           defaultAdapterParams
  //         )
  //       ).nativeFee,
  //     }
  //   );
  //   await sendFromTx.wait();

  //   expect(await erc1155FacetPolygon.balanceOf(deployer, 0)).to.be.equal(
  //     ethers.BigNumber.from(0)
  //   );
  //   expect(await erc1155FacetGotchichain.balanceOf(deployer, 0)).to.be.equal(
  //     ethers.BigNumber.from(1)
  //   );
  // });
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
