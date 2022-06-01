import {
  impersonate,
  mineBlocks,
  realmDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { TestBeforeVars, UpgradeQueue } from "../../types";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  approveAlchemica,
  mintAlchemica,
  testInstallations,
  genEquipInstallationSignature,
  genUpgradeInstallationSignature,
} from "../../scripts/realm/realmHelpers";
import { maticDiamondAddress, alchemica } from "../../constants";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-refund";

describe("Testing Installation Refund", async function () {
  const testAddress = "0x7E4724C60718A9F87CE51bcF8812Bf90D0b7B9Db";
  const testParcelId = 6614;

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    await upgrade();
  });

  it("Setup installation diamond", async function () {
    const realmFacet = await impersonate(
      testAddress,
      await ethers.getContractAt(
        "RealmFacet",
        "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11"
      ),
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

    const sig = genEquipInstallationSignature(testParcelId, 12, 7, 7);

    await realmFacet.unequipInstallation(testParcelId, 12, 7, 7, sig);
    console.log(await fud.balanceOf(testAddress));
    console.log(await fomo.balanceOf(testAddress));
  });
});
