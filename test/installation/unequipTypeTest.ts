import { impersonate, maticAavegotchiDiamondAddress } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";

import { genEquipInstallationSignature, testInstallations } from "../../scripts/realm/realmHelpers";
import {
  aavegotchiDAOAddress,
  alchemica,
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress, maticTileDiamondAddress,
  pixelcraftAddress
} from "../../constants";
import { installationTypes } from "../../data/installations/altars";

import { upgrade } from "../../scripts/installation/upgrades/upgrade-unequippable";
import { BigNumber } from "ethers";
import { ERC20, InstallationFacet, OwnershipFacet } from "../../typechain";
import { expect } from "chai";
import { alchemicaTotals, boostMultipliers, greatPortalCapacity } from "../../scripts/setVars";

describe("Testing unequipType", async function () {
  const testAddress = "0xc76b85cd226518daf2027081deff2eac4cc91a00";
  const testParcelId = 6614;
  let installationAdminFacet;
  let installationFacet;
  let realmFacet;
  let alchemicaFacet;
  const testInstallationType =
    {
      id: 19,
      installationType: 0,
      level: 9,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [20000, 30000, 15000, 6000],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 400,
      spillRate: 10,
      upgradeQueueBoost: 1,
      craftTime: 3200000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [8, 0],
      name: "Alchemical Aaltar Level Test",
      unequipType: 0,
    };

  before(async function () {
    this.timeout(20000000);

    await upgrade();

    const installationOwnershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      maticInstallationDiamondAddress
    )) as OwnershipFacet;
    const installationOwner = await installationOwnershipFacet.owner();
    installationAdminFacet = await impersonate(
      installationOwner,
      await ethers.getContractAt("InstallationAdminFacet", maticInstallationDiamondAddress),
      ethers,
      network
    );
    installationFacet = await impersonate(
      testAddress,
      await ethers.getContractAt("InstallationFacet", maticInstallationDiamondAddress),
      ethers,
      network
    );

    const realmOwnershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      maticRealmDiamondAddress
    )) as OwnershipFacet;
    const realmOwner = await realmOwnershipFacet.owner();
    alchemicaFacet = await impersonate(
      realmOwner,
      await ethers.getContractAt("AlchemicaFacet", maticRealmDiamondAddress),
      ethers,
      network
    );
    realmFacet = await impersonate(
      testAddress,
      await ethers.getContractAt("RealmFacet", maticRealmDiamondAddress),
      ethers,
      network
    );

    const backendSigner = new ethers.Wallet(process.env.PROD_PK);
    await (await alchemicaFacet.setVars(
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      maticInstallationDiamondAddress,
      "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
      "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
      alchemica,
      ethers.constants.AddressZero,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      ethers.constants.AddressZero,
      maticTileDiamondAddress,
      maticAavegotchiDiamondAddress
    )).wait();
  });

  it("Should succeed when fetch unequip type of current installation types", async function () {
    [0, 5, 9, 10, 17].forEach(async (typeId) => {
      const itemType = await installationFacet.getInstallationType(typeId);
      expect(itemType.unequipType).to.equal(0);
    })
  })

  it("Should succeed when add installation types with owner", async function () {
    const receipt = await (
      await installationAdminFacet.addInstallationTypes([testInstallationType])
    ).wait();
    const events = receipt!.events!.filter(
      (event) => event.event === "AddInstallationType"
    );
    expect(events.length).to.equal(1);
    const itemType = await installationFacet.getInstallationType(testInstallationType.id);
    expect(itemType.name).to.equal(testInstallationType.name);
    expect(itemType.unequipType).to.equal(testInstallationType.unequipType);
  })

  it("Should succeed when edit installation unequip types with owner", async function () {
    const receipt = await (
      await installationAdminFacet.editInstallationUnequipTypes([testInstallationType.id], [1])
    ).wait();
    const events = receipt!.events!.filter(
      (event) => event.event === "EditInstallationUnequipType"
    );
    expect(events.length).to.equal(1);
    const itemType = await installationFacet.getInstallationType(testInstallationType.id);
    expect(itemType.name).to.equal(testInstallationType.name);
    expect(itemType.unequipType).to.equal(1);
  })

  it("Should burn and refund when unequip normal installation", async function () {
    const fud = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      alchemica[0]
    )) as ERC20;
    const fomo = (await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      alchemica[1]
    )) as ERC20;
    const currentFud = await fud.balanceOf(testAddress);
    const currentFomo = await fomo.balanceOf(testAddress);

    const lvl1 = installationTypes[0]; //id 10
    const lvl2 = installationTypes[1]; //id 11
    const lvl3 = installationTypes[2]; //id 12
    const lvl4 = installationTypes[3]; //id 13

    const lvls = [lvl1, lvl2, lvl3, lvl4];

    const costs: BigNumber[] = [
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0),
    ];

    const refund: BigNumber[] = [
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0),
      BigNumber.from(0),
    ];

    lvls.forEach((lvl) => {
      lvl.alchemicaCost.forEach((amt, index) => {
        costs[index] = costs[index].add(amt);

        const refundAmt = BigNumber.from(amt).div(2);
        refund[index] = refund[index].add(refundAmt);
      });
    });

    const sig = await genEquipInstallationSignature(testParcelId, 13, 8, 8);
    await (await realmFacet.unequipInstallation(testParcelId, 13, 8, 8, sig)).wait();
    const fudAfterBal = await fud.balanceOf(testAddress);
    const fomoAfterBal = await fomo.balanceOf(testAddress);

    const fudDiff = ethers.utils.formatEther(fudAfterBal.sub(currentFud));
    const fomoDiff = ethers.utils.formatEther(fomoAfterBal.sub(currentFomo));

    expect(Number(fudDiff)).to.equal(refund[0].toNumber());
    expect(Number(fomoDiff)).to.equal(refund[1].toNumber());
  });
});
