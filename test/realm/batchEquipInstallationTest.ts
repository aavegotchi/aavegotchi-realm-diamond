import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../constants";
import { expect } from "chai";
import { batchEquipUpgrade } from "../../scripts/realm/upgrades/upgrade-batchEquip";
import {
  InstallationFacet,
  RealmFacet,
  TileFacet,
  OwnershipFacet,
  AlchemicaFacet,
} from "../../typechain";
import { RealmGettersAndSettersFacet } from "../../typechain-types";
import { TileTypeInput } from "../../types";
import {
  genEquipInstallationSignature,
  outputInstallation,
  outputTile,
} from "../../scripts/realm/realmHelpers";
import { impersonate } from "../../scripts/helperFunctions";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import { alchemica, Constants } from "../../constants";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC76b85Cd226518DAF2027081dEfF2Eac4Cc91a00";
  const diamondAddress: string = "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";

  let realmFacet: RealmFacet;
  let installationsFacet: InstallationFacet;
  let tileFacet: TileFacet;
  let ownershipFacet: OwnershipFacet;
  let alchemicaFacet: AlchemicaFacet;
  let realmGettersAndSettersFacet: RealmGettersAndSettersFacet;
  let ownerAddress: string;
  let testParcelId: number;

  before(async function () {
    this.timeout(20000000);

    await batchEquipUpgrade();

    const c = await varsForNetwork(ethers);
    // testParcelId = 4887; //6614
    testParcelId = 6614;

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond
    )) as RealmFacet;

    tileFacet = (await ethers.getContractAt(
      "TileFacet",
      c.tileDiamond
    )) as TileFacet;

    installationsFacet = (await ethers.getContractAt(
      "InstallationFacet",
      c.installationDiamond
    )) as InstallationFacet;

    ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      c.realmDiamond
    )) as AlchemicaFacet;

    realmGettersAndSettersFacet = (await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      c.realmDiamond
    )) as RealmGettersAndSettersFacet;

    ownerAddress = await ownershipFacet.owner();

    alchemicaFacet = await impersonate(
      ownerAddress,
      alchemicaFacet,
      ethers,
      network
    );

    const backendSigner = new ethers.Wallet(process.env.PROD_PK);
    await (
      await alchemicaFacet.setVars(
        //@ts-ignore
        alchemicaTotals(),
        boostMultipliers,
        greatPortalCapacity,
        "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A",
        "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
        "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
        alchemica,
        ethers.constants.AddressZero,
        ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
        ethers.constants.AddressZero,
        "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355",
        "0x86935F11C86623deC8a25696E1C19a8659CbF95d"
      )
    ).wait();
  });

  it.only("Can craft installations and tiles", async () => {
    //Craft all the tiles/installations you need
    installationsFacet = await impersonate(
      testAddress,
      installationsFacet,
      ethers,
      network
    );

    await installationsFacet.craftInstallations([10, 10, 10], [0, 0, 0]);
    let installationsBalance = await installationsFacet.installationsBalances(
      testAddress
    );
    console.log("Installations Balance: ", installationsBalance.toString());
    await expect(installationsBalance[1].toString()).to.equal("10,76");
    await installationsFacet.craftInstallations([10], [0]);
    installationsBalance = await installationsFacet.installationsBalances(
      testAddress
    );
    console.log("New Installations Balance: ", installationsBalance.toString());
    await expect(installationsBalance[1].toString()).to.equal("10,77");

    const tileTypes: TileTypeInput[] = [
      {
        id: 8,
        name: "LE Golden Tile - Gotchi",
        width: 8,
        height: 8,
        deprecated: false,
        tileType: 0,
        alchemicaCost: [25, 25, 75, 25],
        craftTime: 0,
      },
      {
        id: 9,
        name: "LE Golden Tile - Gotchi",
        width: 8,
        height: 8,
        deprecated: false,
        tileType: 0,
        alchemicaCost: [25, 25, 75, 25],
        craftTime: 0,
      },
    ];

    tileFacet = await impersonate(ownerAddress, tileFacet, ethers, network);

    const tile1 = outputTile(tileTypes[0]);
    const tile2 = outputTile(tileTypes[1]);

    await tileFacet.addTileTypes([tile1, tile2]);

    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);

    await tileFacet.craftTiles([8]);
    await tileFacet.craftTiles([9]);

    const tileBalance = await tileFacet.tilesBalances(testAddress);

    console.log("Tile Balance: ", tileBalance.toString());

    await expect(tileBalance[tileBalance.length - 2].toString()).to.equal(
      "8,1"
    );
    await expect(tileBalance[tileBalance.length - 1].toString()).to.equal(
      "9,1"
    );

    realmGettersAndSettersFacet = await impersonate(
      testAddress,
      realmGettersAndSettersFacet,
      ethers,
      network
    );
    let getParcelID = await realmGettersAndSettersFacet.getParcelInfo(
      testParcelId
    );
    console.log("Parcel Info: ", getParcelID.toString());
    console.log("Parcel Owner: ", getParcelID[2].toString());
    await expect(getParcelID[2].toString()).to.equal(testAddress);
  });

  it.only("Can batch equip installations", async () => {
    const installationBatchEquip = {
      types: [0, 0],
      equip: [true, true],
      ids: [10, 10],
      x: [8, 8],
      y: [8, 8],
    };

    installationsFacet = await impersonate(
      testAddress,
      installationsFacet,
      ethers,
      network
    );

    let installationsBalance = await installationsFacet.installationsBalances(
      testAddress
    );
    console.log("Installations Balance: ", installationsBalance.toString());

    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);

    const sig = await genEquipInstallationSignature(
      testParcelId,
      12565,
      10,
      8,
      8
    );
    console.log("Batching");
    await realmFacet.batchEquip(testParcelId, 10, installationBatchEquip, [
      sig,
    ]);

    // let parcelTokenBalance =
    //   await installationsFacet.installationBalancesOfTokenByIds(
    //     realmFacet,
    //     testParcelId,
    //     [1]
    //   );
  });

  it("Can batch unequip installations", async () => {
    const installationBatchUnequip = {
      types: [0, 0],
      equip: [false, false],
      ids: [1, 1],
      x: [8, 8],
      y: [8, 8],
    };

    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);

    const sig = await genEquipInstallationSignature(
      testParcelId,
      12565,
      10,
      8,
      8
    );
    console.log("Batching");
    await realmFacet.batchEquip(testParcelId, 12565, installationBatchUnequip, [
      sig,
    ]);
  });

  it("Can batch equip and unequip installations", async () => {
    const installationBatchEquipAndUnequip = {
      types: [0, 0],
      equip: [true, false],
      ids: [1, 2],
      x: [8, 8],
      y: [8, 8],
    };

    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);

    const sig = await genEquipInstallationSignature(
      testParcelId,
      12565,
      10,
      8,
      8
    );
    console.log("Batching");
    await realmFacet.batchEquip(
      testParcelId,
      12565,
      installationBatchEquipAndUnequip,
      [sig]
    );
  });

  it("Can batch equip tiles", async () => {
    const tileBatchEquip = {
      types: [0, 0],
      equip: [true, true],
      ids: [1, 1],
      x: [8, 8],
      y: [8, 8],
    };

    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);

    const sig = await genEquipInstallationSignature(
      testParcelId,
      12565,
      10,
      8,
      8
    );
    console.log("Batching");
    await realmFacet.batchEquip(testParcelId, 12565, tileBatchEquip, [sig]);
  });

  it("Can batch unequip tiles", async () => {
    const tileBatchUnequip = {
      types: [0, 0],
      equip: [false, false],
      ids: [1, 1],
      x: [8, 8],
      y: [8, 8],
    };

    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);

    const sig = await genEquipInstallationSignature(
      testParcelId,
      12565,
      10,
      8,
      8
    );
    console.log("Batching");
    await realmFacet.batchEquip(testParcelId, 12565, tileBatchUnequip, [sig]);
  });

  it("Can batch equip and unequip tiles", async () => {
    const tileBatchEquipAndUnepuip = {
      types: [0, 0],
      equip: [true, false],
      ids: [1, 2],
      x: [8, 8],
      y: [8, 8],
    };

    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);

    const sig = await genEquipInstallationSignature(
      testParcelId,
      12565,
      10,
      8,
      8
    );
    console.log("Batching");
    await realmFacet.batchEquip(testParcelId, 12565, tileBatchEquipAndUnepuip, [
      sig,
    ]);
  });
});
