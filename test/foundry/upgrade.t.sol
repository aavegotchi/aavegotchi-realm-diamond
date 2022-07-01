// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {InstallationFacet} from "@installation/facets/InstallationFacet.sol";
import {RealmFacet} from "@realm/facets/RealmFacet.sol";
import {IDiamondCut} from "@interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "@interfaces/IDiamondLoupe.sol";
import {Ownable} from "@interfaces/Ownable.sol";
import {console2} from "forge-std/console2.sol";

contract TestUpgrades {
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
}
