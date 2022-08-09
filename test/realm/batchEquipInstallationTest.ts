import { ethers } from "hardhat";
import { varsForNetwork } from "../../constants";
import { batchEquipUpgrade } from "../../scripts/realm/upgrades/upgrade-batchEquip";
import { InstallationFacet, RealmFacet } from "../../typechain";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";

  let realmFacet: RealmFacet;
  let installationsFacet: InstallationFacet;

  before(async function () {
    this.timeout(20000000);

    await batchEquipUpgrade();

    const c = await varsForNetwork(ethers);

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond
    )) as RealmFacet;

    installationsFacet = (await ethers.getContractAt(
      "InstallationFacet",
      c.installationDiamond
    )) as InstallationFacet;
  });

  it("Can craft installations and tiles", async () => {
    //Craft all the tiles/installations you need
    await installationsFacet.craftInstallations([1, 1, 1], [0, 0, 0]);
  });

  it("Can batch equip installations", async () => {});

  it("Can batch unequip installations", async () => {});

  it("Can batch equip and unequip installations", async () => {});

  it("Can batch equip tiles", async () => {});

  it("Can batch unequip tiles", async () => {});

  it("Can batch equip and unequip tiles", async () => {});
});
