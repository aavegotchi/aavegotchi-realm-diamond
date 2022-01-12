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
import { InstallationType, TestBeforeVars } from "../../types";
import { deployDiamond } from "../../scripts/installation/deploy";
import { BigNumber } from "ethers";
import {
  beforeTest,
  testInstallations,
} from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";

  let ghst: IERC20;
  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);
    g = await beforeTest(ethers);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7"
    )) as IERC20;
  });

  it("Can craft installations", async function () {
    await g.installationDiamond.addInstallationTypes(testInstallations());
    ghst = await impersonate(testAddress, ghst, ethers, network);
    g.installationDiamond = await impersonate(
      testAddress,
      g.installationDiamond,
      ethers,
      network
    );
    await ghst.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );

    g.alchemicaFacet.testingAlchemicaFaucet(
      "0",
      ethers.utils.parseEther("1000")
    );
    g.alchemicaFacet.testingAlchemicaFaucet(
      "1",
      ethers.utils.parseEther("1000")
    );
    g.alchemicaFacet.testingAlchemicaFaucet(
      "2",
      ethers.utils.parseEther("1000")
    );
    g.alchemicaFacet.testingAlchemicaFaucet(
      "3",
      ethers.utils.parseEther("1000")
    );

    await g.installationDiamond.craftInstallations([1, 1, 1]);
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("g.installationDiamond: installation not ready");
    for (let i = 0; i < 11000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePre = await g.erc1155Facet.balanceOf(testAddress, 1);
    await g.installationDiamond.claimInstallations([0, 1, 2]);
    const balancePost = await g.erc1155Facet.balanceOf(testAddress, 1);
    expect(balancePost).to.above(balancePre);

    const itemTypes = await g.installationDiamond.getInstallationTypes([
      "0",
      "1",
    ]);
    expect(itemTypes.length).to.equal(2);
  });

  it("Can equip installation", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipInstallation(2893, 1, 2, 2);
    await expect(
      g.realmFacet.equipInstallation(2893, 1, 1, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(2893, 1, 2, 1)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(2893, 1, 2, 2)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(2893, 1, 3, 3)
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(2893, 1, 62, 10)
    ).to.be.revertedWith("LibRealm: x exceeding width");
    await expect(
      g.realmFacet.equipInstallation(2893, 1, 10, 30)
    ).to.be.revertedWith("LibRealm: y exceeding height");
    await g.realmFacet.equipInstallation(2893, 1, 6, 6);
    await g.realmFacet.equipInstallation(2893, 1, 20, 20);
    await expect(
      g.realmFacet.equipInstallation(2893, 1, 18, 18)
    ).to.be.revertedWith("LibItems: Doesn't have that many to transfer");
  });

  it("Should receive 50% of installation cost after unequipping", async function () {
    const installationType = await g.installationDiamond.getInstallationType(
      "1"
    );

    const alchemicaCost = installationType.alchemicaCost;

    let totalCost = BigNumber.from(0);

    alchemicaCost.forEach((alc) => {
      totalCost = totalCost.add(alc);
    });

    const refund = totalCost.div(2);
    const beforeBalance = await ghst.balanceOf(testAddress);
    await g.realmFacet.unequipInstallation("2893", "1", "2", "2");
    const afterBalance = await ghst.balanceOf(testAddress);
    expect(afterBalance).to.equal(beforeBalance.add(refund));
  });
});
