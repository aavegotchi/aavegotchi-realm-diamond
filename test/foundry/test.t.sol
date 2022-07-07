// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {InstallationFacet} from "@installation/facets/InstallationFacet.sol";
import {TestInstallationFacet} from "@installation/facets/TestInstallationFacet.sol";
import {RealmFacet} from "@realm/facets/RealmFacet.sol";
import {TestConstants as C} from "@test/constants.t.sol";
import {IDiamondCut} from "@interfaces/IDiamondCut.sol";
import {console2} from "forge-std/console2.sol";
import {TestUpgrades} from "@test/upgrade.t.sol";

contract TestFoundryDiamond is Test, TestUpgrades {
  InstallationFacet installationFacet;
  TestInstallationFacet testInstallationFacet;
  RealmFacet realmFacet;

  function setUp() public {
    replaceAlchemicaFacetSelectors(false);
    replaceRealmFacetSelectors(false);
    replaceInstallationFacetSelectors(false);
    installationFacet = InstallationFacet(C.INSTALLATION_DIAMOND_ADDRESS_MATIC);
    testInstallationFacet = TestInstallationFacet(C.INSTALLATION_DIAMOND_ADDRESS_MATIC);
    realmFacet = RealmFacet(C.REALM_DIAMOND_ADDRESS_MATIC);
  }

  function test1() public view {
    console2.log(installationFacet.getAltarLevel(12));
  }
}
