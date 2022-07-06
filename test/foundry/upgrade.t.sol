// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import {TestConstants as C} from "@test/constants.t.sol";
import {IDiamondCut} from "@interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "@interfaces/IDiamondLoupe.sol";
import {Ownable} from "@interfaces/Ownable.sol";
import {console2} from "forge-std/console2.sol";

import {InstallationFacet} from "@installation/facets/InstallationFacet.sol";
import {TestInstallationFacet} from "@installation/facets/TestInstallationFacet.sol";
import {RealmFacet} from "@realm/facets/RealmFacet.sol";
import {AlchemicaFacet} from "@realm/facets/AlchemicaFacet.sol";
import {VRFFacet} from "@realm/facets/VRFFacet.sol";
import {TestRealmFacet} from "@realm/facets/TestRealmFacet.sol";

contract TestUpgrades is Test {
  function logFunctionSelectors(IDiamondCut.FacetCut[] memory cuts) internal view {
    for (uint256 i; i < cuts.length; i++) {
      if (cuts[i].action == IDiamondCut.FacetCutAction.Replace) {
        console2.log("Replace Facet Selectors:");
        for (uint256 j; j < cuts[i].functionSelectors.length; j++) {
          console2.logBytes4(cuts[i].functionSelectors[j]);
        }
      } else if (cuts[i].action == IDiamondCut.FacetCutAction.Add) {
        console2.log("Add Facet Selectors:");
        for (uint256 j; j < cuts[i].functionSelectors.length; j++) {
          console2.logBytes4(cuts[i].functionSelectors[j]);
        }
      } else {
        console2.log("Remove Facet Selectors:");
        for (uint256 j; j < cuts[i].functionSelectors.length; j++) {
          console2.logBytes4(cuts[i].functionSelectors[j]);
        }
      }
    }
  }

  function getDiamondOwner(address diamond) internal view returns (address) {
    return Ownable(diamond).owner();
  }

  /// @dev Intended to be used to get the old facet address for a specific facet to replace all the functions with the ones from a new facet
  function getFacetAddress(address diamond, bytes4 functionSelector) internal view returns (address) {
    return IDiamondLoupe(diamond).facetAddress(functionSelector);
  }

  function getFacetSelectors(address diamond, address facet) internal view returns (bytes4[] memory) {
    return IDiamondLoupe(diamond).facetFunctionSelectors(facet);
  }

  function getFacetSelectorsFromExistingSelector(address diamond, bytes4 functionSelector) internal view returns (bytes4[] memory) {
    return getFacetSelectors(diamond, getFacetAddress(diamond, functionSelector));
  }

  function getAddFacetSelectorCut(address facetAddress, bytes4[] memory functionSelectors) internal pure returns (IDiamondCut.FacetCut memory cut) {
    cut = IDiamondCut.FacetCut({facetAddress: facetAddress, action: IDiamondCut.FacetCutAction.Add, functionSelectors: functionSelectors});
  }

  function getReplaceFacetSelectorCut(address facetAddress, bytes4[] memory functionSelectors)
    internal
    pure
    returns (IDiamondCut.FacetCut memory cut)
  {
    cut = IDiamondCut.FacetCut({facetAddress: facetAddress, action: IDiamondCut.FacetCutAction.Replace, functionSelectors: functionSelectors});
  }

  function getReplaceFacetSelectorCutFromExistingSelector(
    address diamond,
    address facetAddress,
    bytes4 existingSelector
  ) internal view returns (IDiamondCut.FacetCut memory cut) {
    cut = getReplaceFacetSelectorCut(facetAddress, getFacetSelectorsFromExistingSelector(diamond, existingSelector));
  }

  function getRemoveFacetSelectorCut(bytes4[] memory functionSelectors) internal pure returns (IDiamondCut.FacetCut memory cut) {
    cut = IDiamondCut.FacetCut({facetAddress: address(0), action: IDiamondCut.FacetCutAction.Remove, functionSelectors: functionSelectors});
  }

  function replaceRealmFacetSelectors(bool _log) internal returns (address) {
    RealmFacet realmFacet = new RealmFacet();
    if (_log) {
      console2.log("New realm facet:");
      console2.log(address(realmFacet));
    }
    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
    cuts[0] = getReplaceFacetSelectorCutFromExistingSelector(
      C.REALM_DIAMOND_ADDRESS_MATIC,
      address(realmFacet),
      RealmFacet.equipInstallation.selector
    );
    if (cuts[0].functionSelectors.length != 0) {
      if (_log) {
        console2.log("Realm Facet Replaced Selectors:");
        logFunctionSelectors(cuts);
      }
      vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
      IDiamondCut(C.REALM_DIAMOND_ADDRESS_MATIC).diamondCut(cuts, address(0), "");
    } else {
      if (_log) console2.log("No Realm Facet Replaced Selectors");
    }
    return address(realmFacet);
  }

  function replaceVRFFacetSelectors(bool _log) internal returns (address) {
    VRFFacet vrfFacet = new VRFFacet();
    if (_log) {
      console2.log("New VRF facet:");
      console2.log(address(vrfFacet));
    }
    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
    cuts[0] = getReplaceFacetSelectorCutFromExistingSelector(C.REALM_DIAMOND_ADDRESS_MATIC, address(vrfFacet), VRFFacet.subscribe.selector);
    if (cuts[0].functionSelectors.length != 0) {
      if (_log) {
        console2.log("VRF Facet Replaced Selectors:");
        logFunctionSelectors(cuts);
      }
      vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
      IDiamondCut(C.REALM_DIAMOND_ADDRESS_MATIC).diamondCut(cuts, address(0), "");
    } else {
      if (_log) console2.log("No VRF Facet Replaced Selectors");
    }
    return address(vrfFacet);
  }

  function replaceAlchemicaFacetSelectors(bool _log) internal returns (address) {
    AlchemicaFacet alchemicaFacet = new AlchemicaFacet();
    if (_log) {
      console2.log("New Alchemica facet:");
      console2.log(address(alchemicaFacet));
    }
    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
    cuts[0] = getReplaceFacetSelectorCutFromExistingSelector(
      C.REALM_DIAMOND_ADDRESS_MATIC,
      address(alchemicaFacet),
      AlchemicaFacet.channelAlchemica.selector
    );
    if (cuts[0].functionSelectors.length != 0) {
      if (_log) {
        console2.log("Alchemica Facet Replaced Selectors:");
        logFunctionSelectors(cuts);
      }
      vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
      IDiamondCut(C.REALM_DIAMOND_ADDRESS_MATIC).diamondCut(cuts, address(0), "");
    } else {
      if (_log) console2.log("No Alchemica Facet Replaced Selectors");
    }
    return address(alchemicaFacet);
  }

  function addTestRealmFacetSelectors(bool _log) internal returns (address) {
    TestRealmFacet testRealmFacet = new TestRealmFacet();
    if (_log) {
      console2.log("New Test Realm facet:");
      console2.log(address(testRealmFacet));
    }

    bytes4[] memory functionSelectors = new bytes4[](4);
    {
      uint256 i;
      functionSelectors[i++] = TestRealmFacet.equipInstallationTest.selector;
      functionSelectors[i++] = TestRealmFacet.startSurveyingTest.selector;
      functionSelectors[i++] = TestRealmFacet.rawFulfillRandomWordsTest.selector;
      functionSelectors[i++] = TestRealmFacet.claimAvailableAlchemicaTest.selector;
    }

    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
    cuts[0] = getAddFacetSelectorCut(address(testRealmFacet), functionSelectors);

    if (cuts[0].functionSelectors.length != 0) {
      if (_log) {
        console2.log("Test Realm Facet Added Selectors:");
        logFunctionSelectors(cuts);
      }
      vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
      IDiamondCut(C.REALM_DIAMOND_ADDRESS_MATIC).diamondCut(cuts, address(0), "");
    } else {
      if (_log) console2.log("No Test Realm Facet Added Selectors");
    }
    return address(testRealmFacet);
  }

  function addVRFFacetSelectors(bool _log, bool _replace) internal returns (address) {
    VRFFacet vrfFacet;
    if (_replace) {
      vrfFacet = VRFFacet(replaceVRFFacetSelectors(_log));
    } else {
      vrfFacet = new VRFFacet();
      if (_log) {
        console2.log("New VRF facet:");
        console2.log(address(vrfFacet));
      }
    }
    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

    bytes4[] memory functionSelectors = new bytes4[](4);
    functionSelectors[0] = VRFFacet.subscribe.selector;
    functionSelectors[1] = VRFFacet.setConfig.selector;
    functionSelectors[2] = VRFFacet.rawFulfillRandomWords.selector;
    functionSelectors[3] = VRFFacet.topUpSubscription.selector;

    cuts[0] = getAddFacetSelectorCut(address(vrfFacet), functionSelectors);
    if (cuts[0].functionSelectors.length != 0) {
      if (_log) {
        console2.log("VRF Facet Added Selectors:");
        logFunctionSelectors(cuts);
      }
      vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
      IDiamondCut(C.REALM_DIAMOND_ADDRESS_MATIC).diamondCut(cuts, address(0), "");
    } else {
      if (_log) console2.log("No VRF Facet Added Selectors");
    }
  }

  function addAlchemicaFacetSelectors(bool _log, bool _replace) internal returns (address) {
    AlchemicaFacet alchemicaFacet;
    if (_replace) {
      alchemicaFacet = AlchemicaFacet(replaceAlchemicaFacetSelectors(_log));
    } else {
      alchemicaFacet = new AlchemicaFacet();
      if (_log) {
        console2.log("New Alchemica facet:");
        console2.log(address(alchemicaFacet));
      }
    }
    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

    bytes4[] memory functionSelectors = new bytes4[](2);
    functionSelectors[0] = AlchemicaFacet.setTotalAlchemicas.selector;
    functionSelectors[1] = AlchemicaFacet.progressSurveyingRound.selector;

    cuts[0] = getAddFacetSelectorCut(address(alchemicaFacet), functionSelectors);
    if (cuts[0].functionSelectors.length != 0) {
      if (_log) {
        console2.log("Alchemica Facet Added Selectors:");
        logFunctionSelectors(cuts);
      }
      vm.prank(getDiamondOwner(C.REALM_DIAMOND_ADDRESS_MATIC));
      IDiamondCut(C.REALM_DIAMOND_ADDRESS_MATIC).diamondCut(cuts, address(0), "");
    } else {
      if (_log) console2.log("No Alchemica Facet Added Selectors");
    }
  }

  function addTestInstallationFacetSelectors(bool _log) internal {
    TestInstallationFacet testInstallationFacet = new TestInstallationFacet();
    if (_log) {
      console2.log("New Test Installation facet:");
      console2.log(address(testInstallationFacet));
    }
    IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);

    bytes4[] memory functionSelectors = new bytes4[](3);
    functionSelectors[0] = TestInstallationFacet.craftInstallationTest.selector;
    functionSelectors[1] = TestInstallationFacet.upgradeInstallationTest.selector;
    functionSelectors[2] = TestInstallationFacet.getInstallationsLength.selector;

    cuts[0] = getAddFacetSelectorCut(address(testInstallationFacet), functionSelectors);
    if (cuts[0].functionSelectors.length != 0) {
      if (_log) {
        console2.log("Test Installation Facet Added Selectors:");
        logFunctionSelectors(cuts);
      }
      vm.prank(getDiamondOwner(C.INSTALLATION_DIAMOND_ADDRESS_MATIC));
      IDiamondCut(C.INSTALLATION_DIAMOND_ADDRESS_MATIC).diamondCut(cuts, address(0), "");
    } else {
      if (_log) console2.log("No Test Installation Facet Added Selectors");
    }
  }
}
