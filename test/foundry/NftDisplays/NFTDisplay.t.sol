// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import {TestConstants} from "@test/constants.t.sol";
import "../../../contracts/RealmDiamond/facets/NFTDisplayFacet.sol";
import "../../../contracts/interfaces/IDiamondCut.sol";
import "../../../contracts/shared/OwnershipFacet.sol";

contract NFTDisplayTests is Test {
  NFTDisplayFacet displayFacet;
  IDiamondCut dCut = IDiamondCut(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);

  function setUp() public {
    address diamondOwner = OwnershipFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).owner();
    vm.startPrank(diamondOwner);
    displayFacet = new NFTDisplayFacet();

    //upgrade diamond
    IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
    cut[0] = IDiamondCut.FacetCut({
      facetAddress: address(displayFacet),
      action: IDiamondCut.FacetCutAction.Add,
      functionSelectors: generateSelectors("NFTDisplayFacet")
    });

    dCut.diamondCut(cut, address(0), "");
  }

  function testWhitelistAndBlacklist() public {
    displayFacet = NFTDisplayFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
    displayFacet.whitelistNFTs(populateAddressArray(), maticChainId());

    for (uint256 i; i == 4; i++) {
      assertEq(displayFacet.viewNFTDisplayStatus(populateAddressArray()[i], maticChainId()[i]), true);
    }
    //blacklist
    displayFacet.blacklistNFTs(populateAddressArray(), maticChainId());
    for (uint256 i; i == 4; i++) {
      assertEq(displayFacet.viewNFTDisplayStatus(populateAddressArray()[i], maticChainId()[i]), false);
    }
  }

  function generateSelectors(string memory _facetName) internal returns (bytes4[] memory selectors) {
    string[] memory cmd = new string[](3);
    cmd[0] = "node";
    cmd[1] = "scripts/genSelectors.js";
    cmd[2] = _facetName;
    bytes memory res = vm.ffi(cmd);
    selectors = abi.decode(res, (bytes4[]));
  }
}

function populateAddressArray() view returns (address[] memory a) {
  a = new address[](4);
  a[0] = 0x86935F11C86623deC8a25696E1C19a8659CbF95d;
  a[1] = TestConstants.REALM_DIAMOND_ADDRESS_MATIC;
  a[2] = TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC;
  a[3] = TestConstants.TILE_DIAMOND_ADDRESS_MATIC;
}

function maticChainId() view returns (uint256[] memory cIds) {
  cIds = new uint256[](4);
  cIds[0] = 137;
  cIds[1] = 137;
  cIds[2] = 137;
  cIds[3] = 137;
}
