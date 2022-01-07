import {
  impersonate,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  RealmFacet,
  IERC20,
  InstallationFacet,
  ERC1155Facet,
  OwnershipFacet,
} from "../../typechain";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-harvesting";
import { InstallationType } from "../../types";
import { deployDiamond } from "../../scripts/installation/deploy";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  // const installationsAddress = "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5";

  let realmFacet: RealmFacet;
  let installationFacet: InstallationFacet;
  let ghst: IERC20;
  let erc1155facet: ERC1155Facet;
  let installationsAddress: string;

  before(async function () {
    this.timeout(20000000);
    await upgrade();

    installationsAddress = await deployDiamond();

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;
    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      installationsAddress
    )) as InstallationFacet;
    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7"
    )) as IERC20;

    erc1155facet = (await ethers.getContractAt(
      "ERC1155Facet",
      installationsAddress
    )) as ERC1155Facet;
  });
  it("Setup installation diamond", async function () {
    const ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      installationsAddress
    )) as OwnershipFacet;
    const owner = await ownershipFacet.owner();
    installationFacet = await impersonate(
      owner,
      installationFacet,
      ethers,
      network
    );
    const setAlchemicaAddresses = [
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    ];
    await installationFacet.setAlchemicaAddresses(setAlchemicaAddresses);
    const getAlchemicaAddresses =
      await installationFacet.getAlchemicaAddresses();
    expect(setAlchemicaAddresses).to.eql(getAlchemicaAddresses);
    let installationsTypes = await installationFacet.getInstallationTypes([]);
    const installations: InstallationType[] = [];
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
      spillRate: 0,
      craftTime: 0,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
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
      spillRate: 0,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
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
      spillRate: 100,
      craftTime: 20000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
    });
    await installationFacet.addInstallationTypes(installations);
    installationsTypes = await installationFacet.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(installations.length);
  });
  it("Craft installations", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    await ghst.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await installationFacet.craftInstallations([1, 1, 1]);
    await expect(installationFacet.claimInstallations([0])).to.be.revertedWith(
      "InstallationFacet: installation not ready"
    );
    for (let i = 0; i < 11000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePre = await erc1155facet.balanceOf(testAddress, 1);
    await installationFacet.claimInstallations([0, 1, 2]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 1);
    expect(balancePost).to.above(balancePre);

    const itemTypes = await installationFacet.getInstallationTypes(["0", "1"]);
    console.log("item types:", itemTypes);
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
    await installationFacet.craftInstallations([1]);
    for (let i = 0; i < 11000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await installationFacet.claimInstallations([3]);
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
