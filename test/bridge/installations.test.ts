import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "../../scripts/deployAll";
import { impersonate, mineBlocks } from "../../scripts/helperFunctions";
import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";

import {
  approveRealAlchemica,
  faucetRealAlchemica,
} from "../../scripts/realm/realmHelpers";
import { ERC1155Facet, IERC20, InstallationFacet } from "../../typechain";
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
  let bridgeFacetPolygonSide: InstallationsPolygonXGotchichainBridgeFacet,
    bridgeFacetGotchichainSide: InstallationsPolygonXGotchichainBridgeFacet;

  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const maticGhstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  let diamondAddress: string;
  let installationFacet: InstallationFacet;
  let erc1155FacetPolygon: ERC1155Facet, erc1155FacetGotchichain: ERC1155Facet;
  let ghst: IERC20;
  let inst, inst2;
  let cutPolygon, cutGotchichain;

  beforeEach(async function () {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    console.log(deployer.address);

    ({ installationDiamond: inst, cut: cutPolygon } = await deploy());
    ({ installationDiamond: inst2, cut: cutGotchichain } = await deploy());

    bridgeFacetPolygonSide = cutPolygon[cutPolygon.length - 1].facet;
    bridgeFacetGotchichainSide =
      cutGotchichain[cutGotchichain.length - 1].facet;

    console.log("bridgeFacetPolygonSide: ", bridgeFacetPolygonSide.address);
    console.log(
      "bridgeFacetGotchichainSide: ",
      bridgeFacetGotchichainSide.address
    );

    erc1155FacetPolygon = (await ethers.getContractAt(
      "ERC1155Facet",
      inst.address
    )) as ERC1155Facet;

    erc1155FacetGotchichain = (await ethers.getContractAt(
      "ERC1155Facet",
      inst2.address
    )) as ERC1155Facet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      inst.address
    )) as InstallationFacet;

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

    console.log("lzEndpointMockA: ", lzEndpointMockA.address);
    console.log("lzEndpointMockB: ", lzEndpointMockB.address);

    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(
      lzEndpointMockA.address,
      inst.address
    );
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
      lzEndpointMockB.address,
      inst2.address
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
    console.log("setUseCustomAdapterParams");

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
    console.log("setTrustedRemote");

    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 150000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 150000);
    await bridgePolygonSide.setMinDstGas(chainId_B, 2, 150000);
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 2, 150000);
    console.log("setMinDstGas");

    //Set layer zero bridge on facet
    await bridgeFacetPolygonSide
      .connect(deployer)
      .setLayerZeroBridge(bridgePolygonSide.address);
    console.log("setLayerZeroBridge");
    await bridgeFacetGotchichainSide
      .connect(deployer)
      .setLayerZeroBridge(bridgeGotchichainSide.address);
    console.log("setLayerZeroBridge2");

    console.log("finished before each");
  });

  it("Craft ID=0 installations with Test Address", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    console.log("ghst: ", ghst.address);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    console.log("installationFacet: ", installationFacet.address);

    await faucetRealAlchemica(testAddress, ethers);
    console.log("faucetRealAlchemica");
    await approveRealAlchemica(testAddress, inst.address, ethers);
    console.log("approveRealAlchemica");

    await ghst.approve(
      installationFacet.address,
      ethers.utils.parseUnits("100000000000000")
    );
    console.log("ghst.approve");

    await installationFacet.craftInstallations([0], [0]);
    console.log("craftInstallations");

    await mineBlocks(ethers, 11000);

    const balancePre = await erc1155FacetPolygon.balanceOf(testAddress, 0);
    // console.log(await installationFacet.getCraftQueue(testAddress));
    await installationFacet.claimInstallations([0]);
    const balancePost = await erc1155FacetPolygon.balanceOf(testAddress, 0);
    console.log("balancePost: ", balancePost);
    expect(balancePost).to.gt(balancePre);

    const bridgePolygonSideImpersonated = await impersonate(
      testAddress,
      bridgePolygonSide,
      ethers,
      network
    );

    const erc1155FacetPolygonSideImpersonated = await impersonate(
      testAddress,
      erc1155FacetPolygon,
      ethers,
      network
    );
    console.log(
      "erc1155FacetPolygonSideImpersonated: ",
      erc1155FacetPolygonSideImpersonated
    );
    await erc1155FacetPolygonSideImpersonated.setApprovalForAll(
      bridgePolygonSide.address,
      true
    );
    console.log("setApprovalForAll");
    let sendFromTx = await bridgePolygonSideImpersonated.sendFrom(
      testAddress,
      chainId_B,
      testAddress,
      0,
      1,
      testAddress,
      ethers.constants.AddressZero,
      defaultAdapterParams,
      {
        value: (
          await bridgePolygonSideImpersonated.estimateSendFee(
            chainId_B,
            testAddress,
            0,
            1,
            false,
            defaultAdapterParams
          )
        ).nativeFee,
      }
    );
    await sendFromTx.wait();
    console.log("sendFromTx");
    console.log(await erc1155FacetGotchichain.balanceOf(testAddress, 0));
    console.log(await erc1155FacetPolygon.balanceOf(testAddress, 0));

    // expect(await erc1155FacetPolygon.balanceOf(testAddress, 0)).to.eql(0);
  });
});
