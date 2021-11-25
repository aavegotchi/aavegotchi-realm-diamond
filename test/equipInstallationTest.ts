import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { RealmFacet, InstallationDiamond, IERC20 } from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-equipInstallation";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const installationsAddress = "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5";
  const installationsOwner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  let realmFacet: RealmFacet;
  let installationDiamond: InstallationDiamond;
  let ghst: IERC20;

  before(async function () {
    this.timeout(20000000);
    await upgrade();

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;
    installationDiamond = (await ethers.getContractAt(
      "InstallationDiamond",
      installationsAddress
    )) as InstallationDiamond;
    ghst = (await ethers.getContractAt(
      "IERC20",
      "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7"
    )) as IERC20;
  });
  it("Setup installation diamond", async function () {
    installationDiamond = await impersonate(
      installationsOwner,
      installationDiamond,
      ethers,
      network
    );
    const setAlchemicaAddresses = [
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    ];
    await installationDiamond.setAlchemicaAddresses(setAlchemicaAddresses);
    const getAlchemicaAddresses =
      await installationDiamond.getAlchemicaAddresses();
    expect(setAlchemicaAddresses).to.eql(getAlchemicaAddresses);
    let installationsTypes = await installationDiamond.getInstallationTypes([]);
    const installations = [];
    installations.push({
      installationType: 0,
      level: 0,
      width: 0,
      height: 0,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillPercentage: 0,
      craftTime: 0,
    });
    installations.push({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [1, 2, 0, 3],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillPercentage: 0,
      craftTime: 10000,
    });
    installations.push({
      installationType: 1,
      level: 1,
      width: 4,
      height: 4,
      alchemicaType: 4,
      alchemicaCost: [4, 5, 6, 0],
      harvestRate: 0,
      capacity: 50000,
      spillRadius: 100,
      spillPercentage: 100,
      craftTime: 20000,
    });
    await installationDiamond.addInstallationTypes(installations);
    installationsTypes = await installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(installations.length);
  });
  it("Craft installations", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    installationDiamond = await impersonate(
      testAddress,
      installationDiamond,
      ethers,
      network
    );
    await ghst.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await installationDiamond.craftInstallations([1, 1, 1]);
    await expect(
      installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    for (let i = 0; i < 11000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePre = await installationDiamond.balanceOf(testAddress, 1);
    await installationDiamond.claimInstallations([0, 1, 2]);
    const balancePost = await installationDiamond.balanceOf(testAddress, 1);
    expect(balancePost).to.above(balancePre);
  });

  it("Equip installation", async function () {
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    await realmFacet.equipInstallation(2893, 1, 2, 2);
    await expect(
      realmFacet.equipInstallation(2893, 1, 1, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 2, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 2, 2)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 3, 3)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 62, 10)
    ).to.be.revertedWith("LibRealm: x exceeding width");
    await expect(
      realmFacet.equipInstallation(2893, 1, 10, 30)
    ).to.be.revertedWith("LibRealm: y exceeding height");
    await realmFacet.equipInstallation(2893, 1, 6, 6);
    await realmFacet.equipInstallation(2893, 1, 20, 20);
    await expect(
      realmFacet.equipInstallation(2893, 1, 18, 18)
    ).to.be.revertedWith("LibItems: Doesn't have that many to transfer");
  });
  it("Unequip installaton", async function () {
    await installationDiamond.craftInstallations([1]);
    for (let i = 0; i < 11000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await installationDiamond.claimInstallations([3]);
    await expect(
      realmFacet.equipInstallation(2893, 1, 1, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 2, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 2, 2)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 3, 3)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await realmFacet.unequipInstallation(2893, 1, 2, 2);
    await realmFacet.equipInstallation(2893, 1, 2, 2);
    await expect(
      realmFacet.equipInstallation(2893, 1, 1, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 2, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 2, 2)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      realmFacet.equipInstallation(2893, 1, 3, 3)
    ).to.be.revertedWith("LibRealm: Invalid spot");
  });
});
