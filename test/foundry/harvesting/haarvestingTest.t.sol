// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import {TestConstants as C} from "@test/constants.t.sol";
import {IDiamondCut} from "@interfaces/IDiamondCut.sol";
import {console2} from "forge-std/console2.sol";
import {TestUpgrades} from "@test/upgrade.t.sol";

import {RealmFacet} from "@realm/facets/RealmFacet.sol";
import {AlchemicaFacet} from "@realm/facets/AlchemicaFacet.sol";
import {VRFFacet} from "@realm/facets/VRFFacet.sol";
import {InstallationAdminFacet} from "@installation/facets/InstallationAdminFacet.sol";
import {InstallationFacet} from "@installation/facets/InstallationFacet.sol";
import {InstallationTypeIO} from "@libraries/AppStorageInstallation.sol";
import {IERC20} from "@interfaces/IERC20.sol";

import {TestRealmFacet} from "@realm/facets/TestRealmFacet.sol";
import {TestInstallationFacet} from "@installation/facets/TestInstallationFacet.sol";

contract HaarvestingTest is Test, TestUpgrades {
  AlchemicaFacet alchemicaFacet;
  RealmFacet realmFacet;
  VRFFacet vrfFacet;
  InstallationAdminFacet installationAdminFacet;
  InstallationFacet installationFacet;

  TestRealmFacet testRealmFacet;
  TestInstallationFacet testInstallationFacet;

  IERC20 fud;
  IERC20 fomo;
  IERC20 alpha;
  IERC20 kek;

  address diamondOwner;

  uint256[] prereqs;
  uint16[] installationIds;

  uint256 internal testParcel = 15882;
  address internal parcelOwner = 0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B;

  function setUp() public {
    setUpFacets();
    addInstallations();
    prepareParcel();
    setTokens();
  }

  function setUpFacets() internal {
    replaceRealmFacetSelectors(false);
    replaceAlchemicaFacetSelectors(false);
    addVRFFacetSelectors(false, true);

    addTestRealmFacetSelectors(false);
    addTestInstallationFacetSelectors(false);

    realmFacet = RealmFacet(C.REALM_DIAMOND_ADDRESS_MATIC);
    vrfFacet = VRFFacet(C.REALM_DIAMOND_ADDRESS_MATIC);
    alchemicaFacet = AlchemicaFacet(C.REALM_DIAMOND_ADDRESS_MATIC);

    installationAdminFacet = InstallationAdminFacet(C.INSTALLATION_DIAMOND_ADDRESS_MATIC);
    installationFacet = InstallationFacet(C.INSTALLATION_DIAMOND_ADDRESS_MATIC);

    testRealmFacet = TestRealmFacet(C.REALM_DIAMOND_ADDRESS_MATIC);
    testInstallationFacet = TestInstallationFacet(C.INSTALLATION_DIAMOND_ADDRESS_MATIC);

    diamondOwner = getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC);
  }

  function addInstallations() internal {
    prereqs.push(0);
    prereqs.push(0);
    uint256[4] memory alchemicaCosts;
    alchemicaCosts[0] = 0;
    alchemicaCosts[1] = 0;
    alchemicaCosts[2] = 0;
    alchemicaCosts[3] = 0;
    InstallationTypeIO[] memory installations = new InstallationTypeIO[](2);
    installations[0] = InstallationTypeIO({
      width: 2,
      height: 2,
      installationType: 1,
      level: 1,
      alchemicaType: 0,
      spillRadius: 0,
      spillRate: 0,
      upgradeQueueBoost: 0,
      craftTime: 0,
      nextLevelId: 100, // Placeholder
      deprecated: false,
      alchemicaCost: alchemicaCosts,
      harvestRate: 4.2 ether,
      capacity: 0,
      prerequisites: prereqs,
      name: "FUD Harvester Level 1",
      unequipType: 0
    });
    installations[1] = InstallationTypeIO({
      width: 2,
      height: 2,
      installationType: 2,
      level: 1,
      alchemicaType: 0,
      spillRadius: 810,
      spillRate: 665,
      upgradeQueueBoost: 0,
      craftTime: 0,
      nextLevelId: 100, // Placeholder
      deprecated: false,
      alchemicaCost: alchemicaCosts,
      harvestRate: 0,
      capacity: 5 ether,
      prerequisites: prereqs,
      name: "FUD Reservoir Level 1",
      unequipType: 0
    });

    vm.startPrank(getDiamondOwner(C.INSTALLATION_DIAMOND_ADDRESS_MATIC));
    installationAdminFacet.addInstallationTypes(installations);

    vm.stopPrank();
  }

  function prepareParcel() internal {
    vm.startPrank(parcelOwner);
    testRealmFacet.startSurveyingTest(testParcel);
    testRealmFacet.rawFulfillRandomWordsTest(testParcel, 0, 0);
    uint256 installationsLength = testInstallationFacet.getInstallationsLength();
    testInstallationFacet.craftInstallationTest(56);
    testInstallationFacet.craftInstallationTest(55);
    testRealmFacet.equipInstallationTest(testParcel, 56, 2, 0);
    testRealmFacet.equipInstallationTest(testParcel, 55, 0, 2);
    vm.stopPrank();
  }

  function setTokens() internal {
    fud = IERC20(C.FUD_MATIC);
    fomo = IERC20(C.FOMO_MATIC);
    alpha = IERC20(C.ALPHA_MATIC);
    kek = IERC20(C.KEK_MATIC);
  }

  function testHaarvesting() public {
    vm.warp(block.timestamp + 1 hours);
    vm.startPrank(parcelOwner);
    uint256 balanceBefore = fud.balanceOf(parcelOwner);
    testRealmFacet.claimAvailableAlchemicaTest(testParcel, 21655);
    uint256 balanceAfter = fud.balanceOf(parcelOwner);
    console2.log("Balance before:");
    console2.log(balanceBefore);
    console2.log("Balance after:");
    console2.log(balanceAfter);
    vm.stopPrank();
  }

  function testHaarvestingRevert() public {
    vm.warp(block.timestamp + 1 hours);
    vm.startPrank(parcelOwner);
    testRealmFacet.claimAvailableAlchemicaTest(testParcel, 21655);
    for (uint256 i; i < 8; i++) {
      vm.warp(block.timestamp + 1 hours);
      vm.expectRevert("AlchemicaFacet: 8 hours claim cooldown");
      testRealmFacet.claimAvailableAlchemicaTest(testParcel, 22003);
    }
    vm.warp(block.timestamp + 1 hours);
    testRealmFacet.claimAvailableAlchemicaTest(testParcel, 22003);

    vm.stopPrank();
  }

  function testBinomialDistribution() public {}
}
