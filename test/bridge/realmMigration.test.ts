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
} from "../../typechain-types";
import { MintParcelInput } from "../../types";
import { BigNumber } from "ethers";

describe("Realms Migration", async function () {
  let installationFacet: InstallationFacet
  let erc1155Facet: ERC1155Facet
  let realmGridFacet: RealmGridFacet
  let realmFacet: RealmFacet
  let erc721Facet: ERC721Facet
  let migrationFacet: MigrationFacet
  let gettersAndSettersFacet: RealmGettersAndSettersFacet
  let installationsDiamond: InstallationDiamond
  let alchemica
  let deployer: SignerWithAddress
  let realmDiamond
  let parcelId = 5

  async function deployFixture() {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];

    ({
      installationDiamond: installationsDiamond,
      alchemica: alchemica,
      realmDiamond: realmDiamond,
    } = await deploy());
    delete alchemica["gltr"];
    const alchemicaWithoutGLTR = Object.values(alchemica);

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

    //Alchemica
    await faucetRealAlchemica(
      deployer.address,
      ethers,
      alchemicaWithoutGLTR,
      realmDiamond.address
    );

    await approveRealAlchemica(
      installationsDiamond.address,
      ethers,
      alchemicaWithoutGLTR
    );

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
    await realmFacet.mintParcels([deployer.address], [parcelId], parcelsTest1);
  }

  beforeEach(async function () {
    await loadFixture(deployFixture);
  });

  it("Saving only simple parcel data", async () => {
    await migrationFacet.migrateParcel(parcelId, parcelInput)

    const parcel = await gettersAndSettersFacet.getParcel(parcelId);

    compareResult(parcelInput, parcel)
  });

  it.only("Saving grids", async () => {
    const sparsedArray = make2DArraySparse(grid)
    
    parcelInput.buildGrid = sparsedArray
    parcelInput.tileGrid = sparsedArray
    parcelInput.startPositionBuildGrid = sparsedArray
    parcelInput.startPositionTileGrid = sparsedArray

    await migrationFacet.migrateParcel(parcelId, parcelInput)
    
    const parcel = await gettersAndSettersFacet.getParcel(parcelId);
 
    compareGrid(grid, parcel.buildGrid, 16, 16)
    compareGrid(grid, parcel.startPositionBuildGrid, 16, 16)
    compareGrid(grid, parcel.tileGrid, 16, 16)
    compareGrid(grid, parcel.startPositionTileGrid, 16, 16)
  });

  it("Saving roundBaseAlchemica and roundAlchemica", async () => {
    parcelInput.roundBaseAlchemica = roundGrid;
    parcelInput.roundAlchemica = roundGrid;

    await migrationFacet.migrateParcel(parcelId, parcelInput)
    
    const parcel = await gettersAndSettersFacet.getParcel(parcelId);

    compareGrid(roundGrid, parcel.roundBaseAlchemica, 10, 10)
    compareGrid(roundGrid, parcel.roundAlchemica, 10, 10)
  })

  it("Saving reservoirs", async () => {
    parcelInput.reservoirs = reservoirsGrid;

    await migrationFacet.migrateParcel(parcelId, parcelInput)
    
    const parcel = await gettersAndSettersFacet.getParcel(parcelId);
    
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
    } catch(e) {
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