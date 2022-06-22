import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";

import { genEquipInstallationSignature } from "../../scripts/realm/realmHelpers";
import { alchemica, maticRealmDiamondAddress } from "../../constants";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-refund";
import { installationTypes } from "../../data/installations/altars";
import { BigNumber } from "ethers";
import { ERC20 } from "../../typechain";
import { expect } from "chai";

describe("Testing Installation Refund", async function () {
  const testAddress = "0xc76b85cd226518daf2027081deff2eac4cc91a00";
  const testParcelId = 6614;

  before(async function () {
    this.timeout(20000000);

    await upgrade();
  });

  it("Setup installation diamond", async function () {
    const realmFacet = await impersonate(
      testAddress,
      await ethers.getContractAt("RealmFacet", maticRealmDiamondAddress),
      ethers,
      network
    );
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

    const sig = genEquipInstallationSignature(testParcelId, 13, 8, 8);

    await realmFacet.unequipInstallation(testParcelId, 13, 8, 8, sig);
    const fudAfterBal = await fud.balanceOf(testAddress);
    const fomoAfterBal = await fomo.balanceOf(testAddress);

    expect(fudAfterBal).to.equal(currentFud);
    expect(fomoAfterBal).to.equal(currentFomo);
  });
});
