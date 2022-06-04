import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";

import { genEquipInstallationSignature } from "../../scripts/realm/realmHelpers";
import { alchemica, maticRealmDiamondAddress } from "../../constants";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-refund";

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
    const fud = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      alchemica[0]
    );
    const fomo = await ethers.getContractAt(
      "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
      alchemica[1]
    );
    const currentFud = await fud.balanceOf(testAddress);
    const currentFomo = await fomo.balanceOf(testAddress);
    console.log(currentFud);
    console.log(currentFomo);

    const sig = genEquipInstallationSignature(testParcelId, 13, 8, 8);

    await realmFacet.unequipInstallation(testParcelId, 13, 8, 8, sig);
    console.log(await fud.balanceOf(testAddress));
    console.log(await fomo.balanceOf(testAddress));
  });
});
