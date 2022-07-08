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
  uint256[] alchemicaTypes;

  uint256 internal testParcel = 15882;
  address internal parcelOwner = 0x8FEebfA4aC7AF314d90a0c17C3F91C800cFdE44B;
  uint256 harvestRate = 5 ether;
  uint256 capacity = 100 ether;

  function setUp() public {
    setUpFacets();
    setAlchemicaTotals();
    addInstallations();
    prepareParcel();
    setTokens();
  }

  function setUpFacets() internal {
    replaceRealmFacetSelectors(false);
    addAlchemicaFacetSelectors(false, true);
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
      harvestRate: harvestRate,
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
      spillRate: 5000,
      upgradeQueueBoost: 0,
      craftTime: 0,
      nextLevelId: 100, // Placeholder
      deprecated: false,
      alchemicaCost: alchemicaCosts,
      harvestRate: 0,
      capacity: capacity,
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
    testRealmFacet.mockStartSurveying(testParcel);
    testRealmFacet.mockRawFulfillRandomWords(testParcel, 0, 0);
    uint16 installationsLength = uint16(testInstallationFacet.mockGetInstallationsLength());
    testInstallationFacet.mockCraftInstallation(installationsLength - 1);
    testInstallationFacet.mockCraftInstallation(installationsLength - 2);
    testRealmFacet.mockEquipInstallation(testParcel, installationsLength - 1, 2, 0);
    testRealmFacet.mockEquipInstallation(testParcel, installationsLength - 2, 0, 2);
    vm.warp(block.timestamp + 9 hours);
    testRealmFacet.mockClaimAvailableAlchemica(testParcel, 22003);
    vm.stopPrank();
  }

  function setTokens() internal {
    fud = IERC20(C.FUD_MATIC);
    fomo = IERC20(C.FOMO_MATIC);
    alpha = IERC20(C.ALPHA_MATIC);
    kek = IERC20(C.KEK_MATIC);
  }

  function setAlchemicaTotals() internal {
    uint256[4][5] memory alchemicaTotals;
    alchemicaTotals[0][0] = 28_473 ether;
    alchemicaTotals[0][1] = 14_237 ether;
    alchemicaTotals[0][2] = 7_118 ether;
    alchemicaTotals[0][3] = 2_847 ether;

    alchemicaTotals[1][0] = 113_893 ether;
    alchemicaTotals[1][1] = 56_947 ether;
    alchemicaTotals[1][2] = 28_473 ether;
    alchemicaTotals[1][3] = 11_389 ether;

    alchemicaTotals[2][0] = 911_145 ether;
    alchemicaTotals[2][1] = 455_573 ether;
    alchemicaTotals[2][2] = 227_786 ether;
    alchemicaTotals[2][3] = 91_115 ether;

    alchemicaTotals[3][0] = 911_145 ether;
    alchemicaTotals[3][1] = 455_573 ether;
    alchemicaTotals[3][2] = 227_786 ether;
    alchemicaTotals[3][3] = 91_115 ether;

    alchemicaTotals[4][0] = 1_822_290 ether;
    alchemicaTotals[4][1] = 911_145 ether;
    alchemicaTotals[4][2] = 455_573 ether;
    alchemicaTotals[4][3] = 182_229 ether;

    vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
    alchemicaFacet.setTotalAlchemicas(alchemicaTotals);
    alchemicaTypes.push(0);
    alchemicaTypes.push(1);
    alchemicaTypes.push(2);
    alchemicaTypes.push(3);
  }

  function testHaarvesting(uint256 time) public {
    vm.assume(time > 8 hours);
    vm.assume(time < 90 days);

    uint256 balanceBefore;
    uint256 balanceAfter;
    uint256 alchemicaGained;

    vm.warp(block.timestamp + time);
    vm.startPrank(parcelOwner);

    balanceBefore = fud.balanceOf(parcelOwner);
    testRealmFacet.mockClaimAvailableAlchemica(testParcel, 21655);
    balanceAfter = fud.balanceOf(parcelOwner);
    alchemicaGained = balanceAfter - balanceBefore;

    uint256 alchemicaExpected = (time * harvestRate) / (1 days);
    alchemicaExpected = alchemicaExpected < capacity ? alchemicaExpected : capacity;
    assertApproxEqAbs(alchemicaGained, alchemicaExpected / 2, 1);
    vm.stopPrank();
  }

  function testHaarvestingRevert() public {
    vm.warp(block.timestamp + 9 hours);
    vm.startPrank(parcelOwner);
    testRealmFacet.mockClaimAvailableAlchemica(testParcel, 21655);
    for (uint256 i; i < 8; i++) {
      vm.warp(block.timestamp + 1 hours);
      vm.expectRevert("AlchemicaFacet: 8 hours claim cooldown");
      testRealmFacet.mockClaimAvailableAlchemica(testParcel, 22003);
    }
    vm.warp(block.timestamp + 1 hours);
    testRealmFacet.mockClaimAvailableAlchemica(testParcel, 22003);

    vm.stopPrank();
  }

  function testHaarvestingGetters() public {
    uint256 time = 10 hours;

    vm.warp(block.timestamp + time);
    vm.startPrank(parcelOwner);

    testRealmFacet.mockClaimAvailableAlchemica(testParcel, 21655);

    console2.log(alchemicaFacet.getHarvestRates(testParcel)[0]);
    console2.log(alchemicaFacet.getCapacities(testParcel)[0]);
    console2.log(alchemicaFacet.getTotalClaimed(testParcel)[0]);
    vm.stopPrank();
  }

  function testBinomialDistribution() public {
    uint256 sumFud;
    uint256 sumFomo;
    uint256 sumAlpha;
    uint256 sumKek;
    for (uint256 i = 1; i < 100; i++) {
      vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
      alchemicaFacet.progressSurveyingRound();
      testRealmFacet.mockStartSurveying(testParcel);
      testRealmFacet.mockRawFulfillRandomWords(testParcel, i, i);
      uint256[] memory roundAlchemica = alchemicaFacet.getRoundAlchemica(testParcel, i);
      sumFud += roundAlchemica[0];
      sumFomo += roundAlchemica[1];
      sumAlpha += roundAlchemica[2];
      sumKek += roundAlchemica[3];
    }
    assertApproxEqAbs(sumFud, (113_893 ether * 99) / 12, (113_893 ether * 99) / 60);
    assertApproxEqAbs(sumFomo, (56_947 ether * 99) / 12, (56_947 ether * 99) / 60);
    assertApproxEqAbs(sumAlpha, (28_473 ether * 99) / 12, (28_473 ether * 99) / 60);
    assertApproxEqAbs(sumKek, (11_389 ether * 99) / 12, (11_389 ether * 99) / 60);
  }
}
