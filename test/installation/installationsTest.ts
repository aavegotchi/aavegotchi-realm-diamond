import {
  impersonate,
  maticAavegotchiDiamondAddress,
  maticGhstAddress,
  maticRealmDiamondAddress,
} from "../scripts/helperFunctions";
import { InstallationFacet, ERC1155Facet, IERC20 } from "../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamond } from "../scripts/deploy";
import { BigNumberish, Signer } from "ethers";

interface InstallationType {
  deprecated: boolean;
  installationType: BigNumberish;
  level: BigNumberish;
  width: BigNumberish;
  height: BigNumberish;
  alchemicaType: BigNumberish;
  alchemicaCost: BigNumberish[];
  harvestRate: BigNumberish;
  capacity: BigNumberish;
  spillRadius: BigNumberish;
  spillRate: BigNumberish;
  craftTime: BigNumberish;
  prerequisites: BigNumberish[];
  nextLevelId: BigNumberish;
}

describe("Installations tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const testAddress2 = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let diamondAddress: string;
  let installationFacet: InstallationFacet;
  let erc1155Facet: ERC1155Facet;
  let ghst: IERC20;
  let accounts: Signer[];
  const testParcelId = "141";

  before(async function () {
    this.timeout(20000000);
    diamondAddress = await deployDiamond();
    accounts = await ethers.getSigners();

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      diamondAddress
    )) as InstallationFacet;
    erc1155Facet = (await ethers.getContractAt(
      "ERC1155Facet",
      diamondAddress
    )) as ERC1155Facet;

    console.log("diamond address:", diamondAddress);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;
  });
  it("Set alchemica addresses", async function () {
    const setAlchemicaAddresses = [
      maticGhstAddress,
      maticGhstAddress,
      maticGhstAddress,
      maticGhstAddress,
    ];
    await installationFacet.setAlchemicaAddresses(setAlchemicaAddresses);
    const getAlchemicaAddresses =
      await installationFacet.getAlchemicaAddresses();
    expect(setAlchemicaAddresses).to.eql(getAlchemicaAddresses);
  });

  it("Set Diamond Addresses", async function () {
    await installationFacet.setAddresses(
      maticAavegotchiDiamondAddress,
      maticRealmDiamondAddress,
      maticGhstAddress
    );
  });

  it("Add installation types", async function () {
    let installationsTypes = await installationFacet.getInstallationTypes([]);
    const installations: InstallationType[] = [];
    installations.push({
      deprecated: false,
      installationType: 0,
      level: 1,
      width: 2,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [1, 2, 0, 3],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      prerequisites: [],
      nextLevelId: 2,
    });

    installations.push({
      deprecated: false,
      installationType: 0,
      level: 1,
      width: 2,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [1, 2, 0, 3],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      prerequisites: [],
      nextLevelId: 2,
    });

    installations.push({
      deprecated: false,
      installationType: 0,
      level: 2,
      width: 2,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [1, 2, 0, 3],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      prerequisites: [],
      nextLevelId: 3,
    });

    await installationFacet.addInstallationTypes(installations);
    installationsTypes = await installationFacet.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(installations.length);
  });

  it("Craft ID=0 installations with Test Address", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    await ghst.approve(
      installationFacet.address,
      ethers.utils.parseUnits("1000000000")
    );
    await installationFacet.craftInstallations([0, 0, 0, 0, 0]);
    await expect(installationFacet.claimInstallations([0])).to.be.revertedWith(
      "InstallationFacet: installation not ready"
    );
    for (let i = 0; i < 11000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePre = await erc1155Facet.balanceOf(testAddress, 0);
    await installationFacet.claimInstallations([0, 1, 2, 3, 4]);
    const balancePost = await erc1155Facet.balanceOf(testAddress, 0);
    expect(balancePost).to.above(balancePre);
  });
  it("Transfer ID=0 installation from Test address to Test Address 2", async function () {
    erc1155Facet = await impersonate(
      testAddress,
      erc1155Facet,
      ethers,
      network
    );

    const balancePre = await erc1155Facet.balanceOf(testAddress, 0);
    const balancePre2 = await erc1155Facet.balanceOf(testAddress2, 0);
    expect(balancePre).to.above(balancePre2);

    await erc1155Facet.safeTransferFrom(testAddress, testAddress2, 0, 3, []);
    const balancePost = await erc1155Facet.balanceOf(testAddress, 0);
    const balancePost2 = await erc1155Facet.balanceOf(testAddress2, 0);
    expect(balancePost2).to.above(balancePost);
  });
  it("Batch transfer ID=1 installations from test address to test address 2", async function () {
    this.timeout(20000000);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    erc1155Facet = await impersonate(
      testAddress,
      erc1155Facet,
      ethers,
      network
    );
    await installationFacet.craftInstallations([1, 1, 1, 1]);
    for (let i = 0; i < 51000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await installationFacet.claimInstallations([5, 6, 7, 8]);
    const balancePreHarv = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 0),
      0
    );
    const balancePreHarv2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 0),
      0
    );
    const balancePreRes = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 1),
      0
    );
    const balancePreRes2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 1),
      0
    );
    await erc1155Facet.safeBatchTransferFrom(
      testAddress,
      testAddress2,
      [0, 1],
      [2, 3],
      []
    );
    const balancePostHarv = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 0),
      0
    );
    const balancePostHarv2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 0),
      0
    );
    const balancePostRes = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 1),
      0
    );
    const balancePostRes2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 1),
      0
    );
    expect(Number(balancePreHarv) + Number(balancePreHarv2)).to.equal(
      Number(balancePostHarv) + Number(balancePostHarv2)
    );
    expect(Number(balancePreRes) + Number(balancePreRes2)).to.equal(
      Number(balancePostRes) + Number(balancePostRes2)
    );
  });

  it("Owner can deprecate installation", async function () {
    installationFacet = await impersonate(
      await accounts[0].getAddress(),
      installationFacet,
      ethers,
      network
    );

    await installationFacet.deprecateInstallations(["1"]);
    await expect(
      installationFacet.craftInstallations(["1"])
    ).to.be.revertedWith("InstallationFacet: Installation has been deprecated");
  });

  it("Equip installation", async function () {
    installationFacet = await impersonate(
      maticRealmDiamondAddress,
      installationFacet,
      ethers,
      network
    );

    await installationFacet.equipInstallation(testAddress2, testParcelId, "0");

    const balances = await installationFacet.installationBalancesOfToken(
      maticRealmDiamondAddress,
      testParcelId
    );
    expect(balances.length).to.above(0);
    expect(balances[0].installationId).to.equal(0);
    expect(balances[0].balance).to.equal(1);
  });

  it("Upgrade installation", async function () {
    const parcelOwner = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
    installationFacet = await impersonate(
      parcelOwner,
      installationFacet,
      ethers,
      network
    );

    await installationFacet.upgradeInstallation({
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      installationId: "0",
      readyBlock: "0", //readyBlock can be 0
      claimed: false,
      owner: parcelOwner,
    });
  });

  it("Finalize upgrade", async function () {
    let upgradeQueue = await installationFacet.getUpgradeQueue();
    expect(upgradeQueue.length).to.equal(1);

    await expect(installationFacet.finalizeUpgrade()).to.be.revertedWith(
      "InstallationFacet: No upgrades ready"
    );

    //Complete upgrade
    for (let i = 0; i < 10001; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await installationFacet.finalizeUpgrade();

    upgradeQueue = await installationFacet.getUpgradeQueue();
    expect(upgradeQueue.length).to.equal(0);

    await expect(installationFacet.finalizeUpgrade()).to.be.revertedWith(
      "InstallationFacet: No upgrades"
    );

    const balances = await installationFacet.installationBalancesOfToken(
      maticRealmDiamondAddress,
      testParcelId
    );
    expect(balances.length).to.above(0);
    expect(balances[0].installationId).to.equal(2);
    expect(balances[0].balance).to.equal(1);
  });
});
