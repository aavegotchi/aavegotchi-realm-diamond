// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {InstallationFacet} from "@installation/facets/InstallationFacet.sol";
import {TestConstants as C} from "@test/constants.t.sol";
import {IDiamondCut} from "@interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "@interfaces/IDiamondLoupe.sol";
import {Ownable} from "@interfaces/Ownable.sol";
import {console2} from "forge-std/console2.sol";

contract TestUpgrades is Test {
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

  function getRemoveFacetSelectorCut(bytes4[] memory functionSelectors) internal pure returns (IDiamondCut.FacetCut memory cut) {
    cut = IDiamondCut.FacetCut({facetAddress: address(0), action: IDiamondCut.FacetCutAction.Remove, functionSelectors: functionSelectors});
  }

  function replaceInstallationFacetSelectors(address diamond, bool prank) internal returns (address) {
    address owner = Ownable(diamond).owner();
    InstallationFacet installationFacet = new InstallationFacet();

    IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
    cut[0] = getReplaceFacetSelectorCut(
      address(installationFacet),
      getFacetSelectorsFromExistingSelector(diamond, installationFacet.installationsBalances.selector)
    );

    if (prank) vm.prank(owner);
    IDiamondCut(diamond).diamondCut(cut, address(0), "");
    return address(installationFacet);
  }

  function addInstallationFacetSelectors(
    address diamond,
    bytes4[] memory functionSelectors,
    bool replace,
    bool prank
  ) internal returns (address) {
    address owner = Ownable(diamond).owner();
    InstallationFacet installationFacet;

    if (replace) {
      installationFacet = InstallationFacet(replaceInstallationFacetSelectors(diamond, prank));
    } else {
      installationFacet = new InstallationFacet();
    }

    IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
    cut[0] = getAddFacetSelectorCut(address(installationFacet), functionSelectors);

    if (prank) vm.prank(owner);
    IDiamondCut(diamond).diamondCut(cut, address(0), "");
    return address(installationFacet);
  }

  function removeInstallationFacetSelectors(
    address diamond,
    bytes4[] memory functionSelectors,
    bool prank
  ) internal {
    address owner = Ownable(diamond).owner();
    InstallationFacet installationFacet;
    IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
    cut[0] = getRemoveFacetSelectorCut(functionSelectors);
    if (prank) vm.prank(owner);
    IDiamondCut(diamond).diamondCut(cut, address(0), "");
  }
}
