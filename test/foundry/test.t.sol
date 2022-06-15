// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {InstallationFacet} from "@installation/facets/InstallationFacet.sol";
import {TestConstants as C} from "@test/constants.t.sol";
import {IDiamondCut} from "@interfaces/IDiamondCut.sol";
import {console2} from "forge-std/console2.sol";
import {TestUpgrades} from "@test/upgrade.t.sol";

contract TestFoundryDiamond is Test, TestUpgrades {
  IDiamondCut diamondCutFacet;
  InstallationFacet installationFacet;

  function setUp() public {
    installationFacet = InstallationFacet(C.INSTALLATION_DIAMOND_ADDRESS_MATIC);
    replaceInstallationFacetSelectors(C.INSTALLATION_DIAMOND_ADDRESS_MATIC, true);
  }

  function test1() public {
    console2.log(installationFacet.getAltarLevel(12));
  }
}
