import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../constants";
import { expect } from "chai";
import { upgradeRealmTest } from "../../scripts/realm/upgrades/test/upgrade-realmTest";
import {
  InstallationFacet,
  RealmFacet,
  TileFacet,
  OwnershipFacet,
  AlchemicaFacet,
  RealmGettersAndSettersFacet,
  TestRealmFacet,
} from "../../typechain";

import { TileTypeInput } from "../../types";
import { outputTile } from "../../scripts/realm/realmHelpers";
import { impersonate } from "../../scripts/helperFunctions";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC76b85Cd226518DAF2027081dEfF2Eac4Cc91a00";

  let realmFacet: RealmFacet;
  let installationsFacet: InstallationFacet;
  let tileFacet: TileFacet;
  let ownershipFacet: OwnershipFacet;
  let alchemicaFacet: AlchemicaFacet;
  let realmGettersAndSettersFacet: RealmGettersAndSettersFacet;
  let testRealmFacet: TestRealmFacet;
  let installationAdminFacet;
  let ownerAddress: string;
  let testParcelId: number;

  before(async function () {
    this.timeout(20000000);

    // await batchEquipUpgrade();
    await upgradeRealmTest();

    const c = await varsForNetwork(ethers);
    // testParcelId = 4887; //6614
    testParcelId = 6614;
    // testParcelId = 2893;

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
      c.installationDiamond
    )) as OwnershipFacet;

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      c.realmDiamond
    )) as AlchemicaFacet;

    realmGettersAndSettersFacet = (await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      c.realmDiamond
    )) as RealmGettersAndSettersFacet;

    testRealmFacet = (await ethers.getContractAt(
      "TestRealmFacet",
      c.realmDiamond
    )) as TestRealmFacet;

    ownerAddress = await ownershipFacet.owner();

    alchemicaFacet = await impersonate(
      ownerAddress,
      alchemicaFacet,
      ethers,
      network
    );

    installationAdminFacet = await impersonate(
      ownerAddress,
      await ethers.getContractAt(
        "InstallationAdminFacet",
        c.installationDiamond
      ),
      ethers,
      network
    );
  });

  it("Can craft installations and tiles", async () => {
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

  it("Can batch equip installations", async () => {
    const installationBatchEquip = {
      types: [0, 0],
      equip: [true, true],
      ids: [51, 27],
      x: [2, 1],
      y: [2, 1],
    };

    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    let equipped = await testRealmFacet.mockBatchEquip(
      testParcelId,
      installationBatchEquip
    );

    await expect(equipped)
      .to.emit(testRealmFacet, "MockEquipInstallation")
      .withArgs(testParcelId, 51, 2, 2);
    await expect(equipped)
      .to.emit(testRealmFacet, "MockEquipInstallation")
      .withArgs(testParcelId, 27, 1, 1);
  });

  it("Can batch unequip installations", async () => {
    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    const unequipBatch = {
      types: [0, 0],
      equip: [false, false],
      ids: [51, 27],
      x: [2, 1],
      y: [2, 1],
    };

    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    let unequipped = await testRealmFacet.mockBatchEquip(
      testParcelId,
      unequipBatch
    );

    await expect(unequipped)
      .to.emit(testRealmFacet, "MockUnequipInstallation")
      .withArgs(testParcelId, 51, 2, 2);
    await expect(unequipped)
      .to.emit(testRealmFacet, "MockUnequipInstallation")
      .withArgs(testParcelId, 27, 1, 1);
  });

  it("Can batch equip and unequip installations", async () => {
    const equipBatch = {
      types: [0, 0],
      equip: [true, true],
      ids: [51, 27],
      x: [2, 1],
      y: [2, 1],
    };

    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    await testRealmFacet.mockBatchEquip(testParcelId, equipBatch);

    const equipAndUnequipBatch = {
      types: [0, 0],
      equip: [false, true],
      ids: [51, 27],
      x: [2, 3],
      y: [2, 3],
    };

    let equipAandUnequip = await testRealmFacet.mockBatchEquip(
      testParcelId,
      equipAndUnequipBatch
    );

    await expect(equipAandUnequip)
      .to.emit(testRealmFacet, "MockUnequipInstallation")
      .withArgs(testParcelId, 51, 2, 2);
    await expect(equipAandUnequip)
      .to.emit(testRealmFacet, "MockEquipInstallation")
      .withArgs(testParcelId, 27, 3, 3);
  });

  it("Can batch equip tiles", async () => {
    tileFacet = await impersonate(testAddress, tileFacet, ethers, network);
    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    const tileUnequipBatch = {
      types: [1],
      equip: [false],
      ids: [2],
      x: [4],
      y: [4],
    };
    await testRealmFacet.mockBatchEquip(testParcelId, tileUnequipBatch);

    const tileEquipBatch = {
      types: [1, 1],
      equip: [true, true],
      ids: [2, 3],
      x: [0, 8],
      y: [0, 8],
    };

    let equipped = await testRealmFacet.mockBatchEquip(
      testParcelId,
      tileEquipBatch
    );

    await expect(equipped)
      .to.emit(testRealmFacet, "MockEquipTile")
      .withArgs(testParcelId, 2, 0, 0);
    await expect(equipped)
      .to.emit(testRealmFacet, "MockEquipTile")
      .withArgs(testParcelId, 3, 8, 8);

    const newTileUnequipBatch = {
      types: [1, 1],
      equip: [false, false],
      ids: [2, 3],
      x: [0, 8],
      y: [0, 8],
    };
    await testRealmFacet.mockBatchEquip(testParcelId, newTileUnequipBatch);
  });

  it("Can batch unequip tiles", async () => {
    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    const newTileEquipBatch = {
      types: [1, 1],
      equip: [true, true],
      ids: [2, 3],
      x: [0, 8],
      y: [0, 8],
    };
    await testRealmFacet.mockBatchEquip(testParcelId, newTileEquipBatch);

    const newTileUnequipBatch = {
      types: [1, 1],
      equip: [false, false],
      ids: [2, 3],
      x: [0, 8],
      y: [0, 8],
    };
    let unequipped = await testRealmFacet.mockBatchEquip(
      testParcelId,
      newTileUnequipBatch
    );

    await expect(unequipped)
      .to.emit(testRealmFacet, "MockUnequipTile")
      .withArgs(testParcelId, 2, 0, 0);
    await expect(unequipped)
      .to.emit(testRealmFacet, "MockUnequipTile")
      .withArgs(testParcelId, 3, 8, 8);
  });

  it("Can batch equip and unequip tiles", async () => {
    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    let tileEquipBatch = {
      types: [1],
      equip: [true],
      ids: [2],
      x: [0],
      y: [0],
    };
    await testRealmFacet.mockBatchEquip(testParcelId, tileEquipBatch);

    let tileUnequipBatch = {
      types: [1, 1],
      equip: [false, true],
      ids: [2, 3],
      x: [0, 8],
      y: [0, 8],
    };
    let equipped = await testRealmFacet.mockBatchEquip(
      testParcelId,
      tileUnequipBatch
    );

    await expect(equipped)
      .to.emit(testRealmFacet, "MockUnequipTile")
      .withArgs(testParcelId, 2, 0, 0);
    await expect(equipped)
      .to.emit(testRealmFacet, "MockEquipTile")
      .withArgs(testParcelId, 3, 8, 8);

    tileEquipBatch = {
      types: [1],
      equip: [false],
      ids: [3],
      x: [8],
      y: [8],
    };
    await testRealmFacet.mockBatchEquip(testParcelId, tileEquipBatch);
  });

  it("CANNOT equip a installation or tile on a position that already has one equipped", async () => {
    testRealmFacet = await impersonate(
      testAddress,
      testRealmFacet,
      ethers,
      network
    );

    const tileEquipBatch = {
      types: [1, 1],
      equip: [true, true],
      ids: [2, 3],
      x: [0, 8],
      y: [0, 8],
    };

    await testRealmFacet.mockBatchEquip(testParcelId, tileEquipBatch);

    await expect(
      testRealmFacet.mockBatchEquip(testParcelId, tileEquipBatch)
    ).to.be.revertedWith("LibRealm: Invalid spot");

    const newEquipBatch = {
      types: [0, 0],
      equip: [true, true],
      ids: [51, 27],
      x: [2, 1],
      y: [2, 1],
    };

    await expect(
      testRealmFacet.mockBatchEquip(testParcelId, newEquipBatch)
    ).to.be.revertedWith("LibRealm: Invalid spot");
  });
});
