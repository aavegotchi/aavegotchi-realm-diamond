import LZEndpointMockCompiled from "@layerzerolabs/solidity-examples/artifacts/contracts/mocks/LZEndpointMock.sol/LZEndpointMock.json";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "../../scripts/deployAll";
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
  RealmFacet,
  RealmGettersAndSettersFacet,
  RealmGridFacet,
  RealmsBridgeGotchichainSide,
  RealmsBridgePolygonSide,
} from "../../typechain-types";
import { MintParcelInput } from "../../types";
import { BigNumber } from "ethers";

describe("Realms Migration", async function () {

  const chainId_A = 1
  const chainId_B = 2
  const minGasToStore = 50000
  const batchSizeLimit = 1
  let polygonAdapterParams: any
  let gotchichainAdapterParams: any

  let LZEndpointMock: any, bridgePolygonSide: RealmsBridgePolygonSide, bridgeGotchichainSide: RealmsBridgeGotchichainSide
  let deployer: SignerWithAddress, alice: SignerWithAddress
  let lzEndpointMockA: any, lzEndpointMockB: any

  let installationFacetPolygonSide: InstallationFacet, installationFacetGotchichainSide: InstallationFacet
  let erc1155FacetPolygonSide: ERC1155Facet, erc1155FacetGotchichainSide: ERC1155Facet
  let realmGridFacetPolygonSide: RealmGridFacet, realmGridFacetGotchichainSide: RealmGridFacet
  let realmFacetPolygonSide: RealmFacet, realmFacetGotchichainSide: RealmFacet
  let erc721FacetPolygonSide: ERC721Facet, erc721FacetGotchichainSide: ERC721Facet
  let migrationFacetPolygonSide: MigrationFacet, migrationFacetGotchichainSide: MigrationFacet
  let gettersAndSettersFacetPolygonSide: RealmGettersAndSettersFacet, gettersAndSettersFacetGotchichainSide: RealmGettersAndSettersFacet
  let installationsDiamondPolygonSide: InstallationDiamond, installationsDiamondGotchichainSide: InstallationDiamond
  let alchemicaPolygonSide, alchemicaGotchichainSide
  let realmDiamondPolygonSide, realmDiamondGotchichainSide
  let parcelId = 5

  async function deployFixture() {
    //Deploy diamond and mint parcel on Polygon side
    const accounts = await ethers.getSigners();
    deployer = accounts[0];

    ({
      installationDiamond: installationsDiamondPolygonSide,
      alchemica: alchemicaPolygonSide,
      realmDiamond: realmDiamondPolygonSide,
    } = await deploy());
    // delete alchemicaPolygonSide["gltr"];
    // const alchemicaWithoutGLTR = Object.values(alchemicaPolygonSide);

    erc721FacetPolygonSide = await ethers.getContractAt(
      "ERC721Facet",
      realmDiamondPolygonSide.address
    );

    //Alchemica
    // await faucetRealAlchemica(
    //   deployer.address,
    //   ethers,
    //   alchemicaWithoutGLTR,
    //   realmDiamondPolygonSide.address
    // );

    // await approveRealAlchemica(
    //   realmDiamondPolygonSide.address,
    //   ethers,
    //   alchemicaWithoutGLTR
    // );

    const boostFomo = Math.floor(Math.random() * 4);
    const boostFud = Math.floor(Math.random() * 4);
    const boostKek = Math.floor(Math.random() * 4);
    const boostAlpha = Math.floor(Math.random() * 4);
    const parcelsTest1: MintParcelInput[] = [{
      coordinateX: 0,
      coordinateY: 0,
      parcelId: "",
      size: 0,
      boost: [0, 0, 0, 0],
      district: 1,
      parcelAddress: "hey-whats-up1",
    }];
    const realmFacetPolygonSide = await ethers.getContractAt(
      "RealmFacet",
      realmDiamondPolygonSide.address
    );
    await realmFacetPolygonSide.mintParcels([deployer.address], [parcelId], parcelsTest1);

    //Deploy diamond on Gotchichain side
    ({
      installationDiamond: installationsDiamondGotchichainSide,
      alchemica: alchemicaGotchichainSide,
      realmDiamond: realmDiamondGotchichainSide,
    } = await deploy());

    migrationFacetGotchichainSide = await ethers.getContractAt(
      "MigrationFacet",
      realmDiamondGotchichainSide.address
    );

    gettersAndSettersFacetGotchichainSide = await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      realmDiamondGotchichainSide.address
    );

    erc721FacetGotchichainSide = await ethers.getContractAt(
      "ERC721Facet",
      realmDiamondGotchichainSide.address
    );

    // Deploy and configure bridges
    LZEndpointMock = await ethers.getContractFactory(LZEndpointMockCompiled.abi, LZEndpointMockCompiled.bytecode)
    const BridgePolygonSide = await ethers.getContractFactory("RealmsBridgePolygonSide");
    const BridgeGotchichainSide = await ethers.getContractFactory("RealmsBridgeGotchichainSide");

    //Deploying LZEndpointMock contracts
    lzEndpointMockA = await LZEndpointMock.deploy(chainId_A)
    lzEndpointMockB = await LZEndpointMock.deploy(chainId_B)

    //Deploying bridge contracts
    bridgePolygonSide = await BridgePolygonSide.deploy(minGasToStore, lzEndpointMockA.address, realmDiamondPolygonSide.address)
    bridgeGotchichainSide = await BridgeGotchichainSide.deploy(minGasToStore, lzEndpointMockB.address, realmDiamondGotchichainSide.address)

    //Wire the lz endpoints to guide msgs back and forth
    lzEndpointMockA.setDestLzEndpoint(bridgeGotchichainSide.address, lzEndpointMockB.address)
    lzEndpointMockB.setDestLzEndpoint(bridgePolygonSide.address, lzEndpointMockA.address)

    //Set each contracts source address so it can send to each other
    await bridgePolygonSide.setTrustedRemote(chainId_B, ethers.utils.solidityPack(["address", "address"], [bridgeGotchichainSide.address, bridgePolygonSide.address]))
    await bridgeGotchichainSide.setTrustedRemote(chainId_A, ethers.utils.solidityPack(["address", "address"], [bridgePolygonSide.address, bridgeGotchichainSide.address]))

    //Set batch size limit
    await bridgePolygonSide.setDstChainIdToBatchLimit(chainId_B, batchSizeLimit)
    await bridgeGotchichainSide.setDstChainIdToBatchLimit(chainId_A, batchSizeLimit)

    //Set min dst gas for swap
    await bridgePolygonSide.setMinDstGas(chainId_B, 1, 4500000)
    await bridgeGotchichainSide.setMinDstGas(chainId_A, 1, 4500000)//73254

    await bridgePolygonSide.setDstChainIdToTransferGas(chainId_B, 1950000)
    await bridgeGotchichainSide.setDstChainIdToTransferGas(chainId_A, 1950000)

    const minGasToTransferAndStorePolygonSide = await bridgePolygonSide.minDstGasLookup(chainId_B, 1)
    const transferGasPerTokenPolygonSide = await bridgePolygonSide.dstChainIdToTransferGas(chainId_B)
    console.log({ minGasToTransferAndStorePolygonSide, transferGasPerTokenPolygonSide })
    
    const minGasToTransferAndStoreGotchichainSide = await bridgeGotchichainSide.minDstGasLookup(chainId_A, 1)
    const transferGasPerTokenGotchichainSide = await bridgeGotchichainSide.dstChainIdToTransferGas(chainId_A)
    console.log({ minGasToTransferAndStoreGotchichainSide, transferGasPerTokenGotchichainSide })

    polygonAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, minGasToTransferAndStorePolygonSide.add(transferGasPerTokenPolygonSide.mul(1))])
    gotchichainAdapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, minGasToTransferAndStoreGotchichainSide.add(transferGasPerTokenGotchichainSide.mul(1))])
  }

  beforeEach(async function () {
    await loadFixture(deployFixture);
  });

  it.only("Saving only simple parcel data", async () => {
    const parcelToMigrate = parcelInput
    parcelToMigrate.owner = bridgeGotchichainSide.address
    await migrationFacetGotchichainSide.migrateParcel(parcelId, parcelInput)

    console.log('bridgeGotchichainSide.address', bridgeGotchichainSide.address)
    console.log('deployer.address', deployer.address)

    const parcel = await gettersAndSettersFacetGotchichainSide.getParcel(parcelId);

    // compareResult(parcelInput, parcel)

    //Estimate nativeFees
    let nativeFee = (await bridgePolygonSide.estimateSendFee(chainId_B, deployer.address, parcelId, false, polygonAdapterParams)).nativeFee

    //Swaping token to Gotchichain
    await erc721FacetPolygonSide.approve(bridgePolygonSide.address, parcelId)
    let sendFromTx = await bridgePolygonSide.sendFrom(
      deployer.address,
      chainId_B,
      deployer.address,
      parcelId,
      deployer.address,
      ethers.constants.AddressZero,
      polygonAdapterParams,
      { value: nativeFee }
    )
    await sendFromTx.wait()


    // console.log("events")
    // const events = Object.keys(bridgeGotchichainSide.interface.events)
    // events.forEach((event) => {
    //   console.log(`${bridgeGotchichainSide.interface.getEventTopic(event)} --- ${event}`)
    // })

    // console.log("getTransactionReceipt")
    // const failedTxReceipt = await ethers.provider.getTransactionReceipt(sendFromTx.hash)
    // console.log("failedTxReceipt", failedTxReceipt.logs)

    // console.log("decode")
    // const decodeData = bridgeGotchichainSide.interface.decodeEventLog("CreditStored", failedTxReceipt.logs[2].data)
    
    // console.log({decodeData})

    // console.log("trusted")
    // const trustedRemote = ethers.utils.solidityPack(
    //   ['address', 'address'],
    //   [bridgePolygonSide.address, bridgeGotchichainSide.address]
    // )
  
    // console.log('Failed messages')
    // console.log(await bridgeGotchichainSide.failedMessages(chainId_A, trustedRemote, 0))
  
    // console.log('\nRetrying message')
    // const tx = await bridgeGotchichainSide.clearCredits(decodeData._payload);
    // console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
    // const receipt = await tx.wait()
  
    // console.log("Message retried");

    // Checking Realms ownership in both chains
    console.log('1')
    expect(await erc721FacetPolygonSide.ownerOf(parcelId)).to.equal(bridgePolygonSide.address)
    console.log('2')
    expect(await erc721FacetGotchichainSide.ownerOf(parcelId)).to.be.equal(deployer.address)
  });

  it("Saving grids", async () => {
    const sparsedArray = make2DArraySparse(grid)

    parcelInput.buildGrid = sparsedArray
    parcelInput.tileGrid = sparsedArray
    parcelInput.startPositionBuildGrid = sparsedArray
    parcelInput.startPositionTileGrid = sparsedArray

    await migrationFacetGotchichainSide.migrateParcel(parcelId, parcelInput)

    const parcel = await gettersAndSettersFacetGotchichainSide.getParcel(parcelId);

    compareResult(parcelInput, parcel)
    compareGrid(grid, parcel.buildGrid, 16, 16)
    compareGrid(grid, parcel.startPositionBuildGrid, 16, 16)
    compareGrid(grid, parcel.tileGrid, 16, 16)
    compareGrid(grid, parcel.startPositionTileGrid, 16, 16)
  });

  it("Saving roundBaseAlchemica and roundAlchemica", async () => {
    parcelInput.roundBaseAlchemica = roundGrid;
    parcelInput.roundAlchemica = roundGrid;

    await migrationFacetGotchichainSide.migrateParcel(parcelId, parcelInput)

    const parcel = await gettersAndSettersFacetGotchichainSide.getParcel(parcelId);

    compareGrid(roundGrid, parcel.roundBaseAlchemica, 10, 10)
    compareGrid(roundGrid, parcel.roundAlchemica, 10, 10)
  })

  it("Saving reservoirs", async () => {
    parcelInput.reservoirs = reservoirsGrid;

    await migrationFacetGotchichainSide.migrateParcel(parcelId, parcelInput)

    const parcel = await gettersAndSettersFacetGotchichainSide.getParcel(parcelId);

    compareGrid(reservoirsGrid, parcel.reservoirs, 4, 4)
  })
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

const parcelInput = {
  owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  parcelAddress: "test",
  parcelId: "test",
  coordinateX: "5",
  coordinateY: "5",
  district: "2",
  size: "1",
  alchemicaBoost: ["1", "1", "1", "1"],
  alchemicaRemaining: ["1", "1", "1", "1"],
  currentRound: "1",
  alchemicaHarvestRate: ["1", "1", "1", "1"],
  lastUpdateTimestamp: ["1", "1", "1", "1"],
  unclaimedAlchemica: ["1", "1", "1", "1"],
  altarId: "1",
  upgradeQueueCapacity: "1",
  upgradeQueueLength: "1",
  lodgeId: "1",
  surveying: true,
  harvesterCount: "1",
  buildGrid: [],
  tileGrid: [],
  startPositionBuildGrid: [],
  startPositionTileGrid: [],
  roundBaseAlchemica: [],
  roundAlchemica: [],
  reservoirs: []
}

const grid = [
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "119", "119", "0", "0", "83", "83", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "119", "119", "0", "0", "83", "83", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "10", "10", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "10", "10", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "101", "101", "0", "0", "65", "65", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "101", "101", "0", "0", "65", "65", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"],
  ["0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"]
]

const roundGrid = [
  ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
  ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1'],
  ['2', '2', '2', '2', '2', '2', '2', '2', '2', '2'],
  ['3', '3', '3', '3', '3', '3', '3', '3', '3', '3'],
  ['4', '4', '4', '4', '4', '4', '4', '4', '4', '4'],
  ['5', '5', '5', '5', '5', '5', '5', '5', '5', '5'],
  ['6', '6', '6', '6', '6', '6', '6', '6', '6', '6'],
  ['7', '7', '7', '7', '7', '7', '7', '7', '7', '7'],
  ['8', '8', '8', '8', '8', '8', '8', '8', '8', '8'],
  ['9', '9', '9', '9', '9', '9', '9', '9', '9', '9'],
]

const reservoirsGrid = [
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [2, 2, 2, 2],
  [3, 3, 3, 3],
]

function compareResult(expectedParcel, resultParcel) {
  expect(expectedParcel.owner).to.equal(resultParcel.owner)
  expect(expectedParcel.parcelAddress).to.equal(resultParcel.parcelAddress)
  expect(expectedParcel.parcelId).to.equal(resultParcel.parcelId)
  expect(expectedParcel.coordinateX).to.equal(resultParcel.coordinateX)
  expect(expectedParcel.coordinateY).to.equal(resultParcel.coordinateY)
  expect(expectedParcel.district).to.equal(resultParcel.district)
  expect(expectedParcel.size).to.equal(resultParcel.size)

  expectedParcel.alchemicaBoost.forEach((value, i) => expect(value).to.equal(resultParcel.alchemicaBoost[i].toString()))
  expectedParcel.alchemicaRemaining.forEach((value, i) => expect(value).to.equal(resultParcel.alchemicaRemaining[i].toString()))

  expect(expectedParcel.currentRound).to.equal(resultParcel.currentRound)

  expectedParcel.alchemicaHarvestRate.forEach((value, i) => expect(value).to.equal(resultParcel.alchemicaHarvestRate[i].toString()))
  expectedParcel.lastUpdateTimestamp.forEach((value, i) => expect(value).to.equal(resultParcel.lastUpdateTimestamp[i].toString()))
  expectedParcel.unclaimedAlchemica.forEach((value, i) => expect(value).to.equal(resultParcel.unclaimedAlchemica[i].toString()))

  expect(expectedParcel.altarId).to.equal(resultParcel.altarId.toString())
  expect(expectedParcel.upgradeQueueCapacity).to.equal(resultParcel.upgradeQueueCapacity.toString())
  expect(expectedParcel.upgradeQueueLength).to.equal(resultParcel.upgradeQueueLength.toString())
  expect(expectedParcel.lodgeId).to.equal(resultParcel.lodgeId.toString())
  expect(expectedParcel.surveying).to.equal(resultParcel.surveying)
  expect(expectedParcel.harvesterCount).to.equal(resultParcel.harvesterCount.toString())
}

function compareGrid(expectedGrid, resultGrid, gridLength, gridHeight) {
  for (let i = 0; i < gridLength; i++) {
    for (let j = 0; j < gridHeight; j++) {
      expect(expectedGrid[i][j].toString()).to.equal(resultGrid[i][j].toString())
    }
  }
}

const make2DArraySparse = (array) => {
  let sparseArray = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      if (BigNumber.from(array[i][j]).toString() !== BigNumber.from(0).toString()) {
        sparseArray.push(i);
        sparseArray.push(j);
        sparseArray.push(array[i][j]);
      }
    }
  }
  return sparseArray;
}

const printGrid = (grid, width, height) => {
  const coordinateToString = (v) => {
    try {
      return BigNumber.from(v.hex).toString()
    } catch (e) {
      return v.toString()
    }
  }

  let result = ''
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      result += `${coordinateToString(grid[i][j])}  `
    }
    result += '\n'
  }
  console.log(result)
}

/*

erc1155Facet = await ethers.getContractAt(
  "ERC1155Facet",
  installationsDiamond.address
);

installationFacet = await ethers.getContractAt(
  "InstallationFacet",
  installationsDiamond.address
);

realmFacet = await ethers.getContractAt(
  "RealmFacet",
  realmDiamond.address
);

realmGridFacet = await ethers.getContractAt(
  "RealmGridFacet",
  realmDiamond.address
);

erc721Facet = await ethers.getContractAt(
  "ERC721Facet",
  realmDiamond.address
);

migrationFacet = await ethers.getContractAt(
  "MigrationFacet",
  realmDiamond.address
);

gettersAndSettersFacet = await ethers.getContractAt(
  "RealmGettersAndSettersFacet",
  realmDiamond.address
);

*/ 