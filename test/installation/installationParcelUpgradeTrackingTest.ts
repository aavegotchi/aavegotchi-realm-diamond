import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  mineBlocks,
  pixelcraftAddress,
} from "../../scripts/helperFunctions";
import {
  InstallationFacet,
  ERC1155Facet,
  IERC20,
  InstallationAdminFacet,
  InstallationUpgradeFacet,
  TestInstallationFacet,
} from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamond } from "../../scripts/installation/deploy";
import { BigNumber, BigNumberish, Signer } from "ethers";
import {
  maticGhstAddress,
  maticRealmDiamondAddress,
} from "../../scripts/installation/helperFunctions";
import { maticInstallationDiamondAddress } from "../../constants";
import {
  approveAlchemica,
  approveRealAlchemica,
  faucetRealAlchemica,
  genUpgradeInstallationSignature,
} from "../../scripts/realm/realmHelpers";
import { InstallationTypeInput, UpgradeQueue } from "../../types";
import { upgrade } from "../../scripts/installation/upgrades/upgrade-parcelUpgradeTracking";
import { upgradeTest } from "../../scripts/installation/upgrades/test/upgrade-testInstallationFacet";

describe("Testing Equip Installation", async function () {
  let installationFacet: InstallationFacet;
  let testInstallationFacet: TestInstallationFacet;
  let installationUpgradeFacet: InstallationUpgradeFacet;
  let upgradeId;
  before(async function () {
    this.timeout(20000000);

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      maticInstallationDiamondAddress
    )) as InstallationFacet;

    testInstallationFacet = (await ethers.getContractAt(
      "TestInstallationFacet",
      maticInstallationDiamondAddress
    )) as TestInstallationFacet;

    installationUpgradeFacet = (await ethers.getContractAt(
      "InstallationUpgradeFacet",
      maticInstallationDiamondAddress
    )) as InstallationUpgradeFacet;

    installationFacet = await impersonate(
      "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B",
      installationFacet,
      ethers,
      network
    );
    testInstallationFacet = await impersonate(
      "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B",
      testInstallationFacet,
      ethers,
      network
    );
    installationUpgradeFacet = await impersonate(
      "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B",
      installationUpgradeFacet,
      ethers,
      network
    );

    await upgrade();
    await upgradeTest();
  });

  it("Should initiate an upgrade for an installation and the getter for parcel upgrades should work", async () => {
    await testInstallationFacet.testUpgradeInstallation(
      {
        owner: "0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B",
        coordinateX: 14,
        coordinateY: 0,
        readyBlock: 0,
        claimed: false,
        parcelId: 15882,
        installationId: 10,
      },
      0
    );
    upgradeId = await installationUpgradeFacet.getParcelUpgradeQueue(15882);
    console.log(await installationUpgradeFacet.getParcelUpgradeQueue(15882));
  });
  it("Should finalize an upgrade and the getter should remove the upgrade id", async () => {
    function delay(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    await mineBlocks(ethers, 65000);
    const tx = await installationUpgradeFacet.finalizeUpgrades(upgradeId);
    await delay(10000);
    console.log(await installationUpgradeFacet.getParcelUpgradeQueue(15882));
  });
});
