import { InstallationUpgradeFacet } from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { maticInstallationDiamondAddress } from "../../constants";
import { InstallationTypeInput, UpgradeQueue } from "../../types";
import { upgrade } from "../../scripts/installation/upgrades/upgrade-parcelUpgradeTracking";

describe("Testing Equip Installation", async function () {
  let installationUpgradeFacet: InstallationUpgradeFacet;
  before(async function () {
    this.timeout(20000000);

    installationUpgradeFacet = (await ethers.getContractAt(
      "InstallationUpgradeFacet",
      maticInstallationDiamondAddress
    )) as InstallationUpgradeFacet;

    await upgrade();
  });

  describe("Testing Parcel Upgrade Tracking", async function () {
    it("Should return more info from parcel upgrade queue", async () => {
      console.log(await installationUpgradeFacet.getParcelUpgradeQueue(11919));
    });
  });
});
