import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
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
  approveAlchemica,
  beforeTest,
  faucetAlchemica,
  genEquipInstallationSignature,
  testInstallations,
} from "../../scripts/realm/realmHelpers";
import { maticRealmDiamondAddress } from "../../scripts/installation/helperFunctions";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";

  let ghst: IERC20;
  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);
    g = await beforeTest(ethers, maticRealmDiamondAddress);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7"
    )) as IERC20;
  });

  it("Can craft installations", async function () {
    await g.installationAdminFacet.addInstallationTypes(testInstallations());
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

    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );

    await faucetAlchemica(g.alchemicaFacet, "10000");
    await approveAlchemica(g, ethers, testAddress, network);

    await g.installationDiamond.craftInstallations([1, 1, 1]);
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");

    await mineBlocks(ethers, 11000);

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
    await g.realmFacet.equipInstallation(
      2893,
      1,
      2,
      2,
      await genEquipInstallationSignature(1, 2, 2, 2893)
    );
    await expect(
      g.realmFacet.equipInstallation(
        2893,
        1,
        1,
        1,
        await genEquipInstallationSignature(1, 1, 1, 2893)
      )
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(
        2893,
        1,
        2,
        1,
        await genEquipInstallationSignature(1, 2, 1, 2893)
      )
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(
        2893,
        1,
        2,
        2,
        await genEquipInstallationSignature(1, 2, 2, 2893)
      )
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(
        2893,
        1,
        3,
        3,
        await genEquipInstallationSignature(1, 3, 3, 2893)
      )
    ).to.be.revertedWith("LibRealm: Invalid spot");
    await expect(
      g.realmFacet.equipInstallation(
        2893,
        1,
        62,
        10,
        await genEquipInstallationSignature(1, 62, 10, 2893)
      )
    ).to.be.revertedWith("LibRealm: x exceeding width");
    await expect(
      g.realmFacet.equipInstallation(
        2893,
        1,
        10,
        30,
        await genEquipInstallationSignature(1, 10, 30, 2893)
      )
    ).to.be.revertedWith("LibRealm: y exceeding height");
    await g.realmFacet.equipInstallation(
      2893,
      1,
      6,
      6,
      await genEquipInstallationSignature(1, 6, 6, 2893)
    );
    await g.realmFacet.equipInstallation(
      2893,
      1,
      20,
      20,
      await genEquipInstallationSignature(1, 20, 20, 2893)
    );
    await expect(
      g.realmFacet.equipInstallation(
        2893,
        1,
        18,
        18,
        await genEquipInstallationSignature(1, 18, 18, 2893)
      )
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
    await g.realmFacet.unequipInstallation(
      "2893",
      "1",
      "2",
      "2",
      await genEquipInstallationSignature(1, 2, 2, 2893)
    );
    const afterBalance = await ghst.balanceOf(testAddress);
    expect(afterBalance).to.equal(beforeBalance.add(refund));
  });
});
