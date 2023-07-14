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
  RealmGridFacet,
} from "../../typechain-types";
import { MintParcelInput } from "../../types";

describe("Realms Migration", async function () {
  let installationFacet: InstallationFacet
  let erc1155Facet: ERC1155Facet
  let realmGridFacet: RealmGridFacet
  let realmFacet: RealmFacet
  let erc721Facet: ERC721Facet
  let migrationFacet: MigrationFacet
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

  it("Save simple parcel data", async () => {
    await migrationFacet.saveSimpleParcelData(simpleParcel, parcelId)

    const returnedSimpleParcel = await migrationFacet.getSimpleParcel(parcelId);

    compareResult(simpleParcel, returnedSimpleParcel)
  });

  it("Save grid", async () => {
    const sparsedArray = make2DArraySparse(grid)
    await migrationFacet.saveBuildGrid(parcelId, sparsedArray)

    const returnedGrid = await migrationFacet.getGrid(parcelId, 0)
    const convertedReturnedGrid = convertContentToString(returnedGrid)

    expect(grid).to.deep.equal(convertedReturnedGrid)
  });

  it("Migrate Parcel", async () => {
    const sparsedArray = make2DArraySparse(grid)

    await migrationFacet.migrateParcel(parcelId, simpleParcel, sparsedArray, sparsedArray, sparsedArray, sparsedArray)

    const returnedSimpleParcel = await migrationFacet.getSimpleParcel(parcelId);
    const returnedGrid = await migrationFacet.getGrid(parcelId, 0)
    const convertedReturnedGrid = convertContentToString(returnedGrid)

    expect(grid).to.deep.equal(convertedReturnedGrid)
    compareResult(simpleParcel, returnedSimpleParcel)
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

const make2DArraySparse = (array) => {
  let sparseArray = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array[i].length; j++) {
      if (array[i][j] !== "0") {
        sparseArray.push(i);
        sparseArray.push(j);
        sparseArray.push(array[i][j]);
      }
    }
  }
  return sparseArray;
}

const convertContentToString = (array) => {
  const returnArray = [];
  for (let i = 0; i < array.length; i++) {
    returnArray.push([]);
    for (let j = 0; j < array[i].length; j++) {
      returnArray[i][j] = array[i][j].toString();
    }
  }
  return returnArray
}

const simpleParcel: MigrationFacet.SimpleParcelStruct = {
  owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  parcelAddress: "test",
  parcelId: "test",
  coordinateX: "5",
  coordinateY: "5",
  district: "2",
  size: "2",
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

function compareResult(simpleParcel: MigrationFacet.SimpleParcelStruct, returnedSimpleParcel: MigrationFacet.SimpleParcelStruct) {
  expect(simpleParcel.owner).to.equal(returnedSimpleParcel.owner)
  expect(simpleParcel.parcelAddress).to.equal(returnedSimpleParcel.parcelAddress)
  expect(simpleParcel.parcelId).to.equal(returnedSimpleParcel.parcelId)
  expect(simpleParcel.coordinateX).to.equal(returnedSimpleParcel.coordinateX)
  expect(simpleParcel.coordinateY).to.equal(returnedSimpleParcel.coordinateY)
  expect(simpleParcel.district).to.equal(returnedSimpleParcel.district)
  expect(simpleParcel.size).to.equal(returnedSimpleParcel.size)

  simpleParcel.alchemicaBoost.forEach((value, i) => expect(value).to.equal(returnedSimpleParcel.alchemicaBoost[i].toString()))
  simpleParcel.alchemicaRemaining.forEach((value, i) => expect(value).to.equal(returnedSimpleParcel.alchemicaRemaining[i].toString()))

  expect(simpleParcel.currentRound).to.equal(returnedSimpleParcel.currentRound)

  simpleParcel.alchemicaHarvestRate.forEach((value, i) => expect(value).to.equal(returnedSimpleParcel.alchemicaHarvestRate[i].toString()))
  simpleParcel.lastUpdateTimestamp.forEach((value, i) => expect(value).to.equal(returnedSimpleParcel.lastUpdateTimestamp[i].toString()))
  simpleParcel.unclaimedAlchemica.forEach((value, i) => expect(value).to.equal(returnedSimpleParcel.unclaimedAlchemica[i].toString()))

  expect(simpleParcel.altarId).to.equal(returnedSimpleParcel.altarId.toString())
  expect(simpleParcel.upgradeQueueCapacity).to.equal(returnedSimpleParcel.upgradeQueueCapacity.toString())
  expect(simpleParcel.upgradeQueueLength).to.equal(returnedSimpleParcel.upgradeQueueLength.toString())
  expect(simpleParcel.lodgeId).to.equal(returnedSimpleParcel.lodgeId.toString())
  expect(simpleParcel.surveying).to.equal(returnedSimpleParcel.surveying)
  expect(simpleParcel.harvesterCount).to.equal(returnedSimpleParcel.harvesterCount.toString())
}
