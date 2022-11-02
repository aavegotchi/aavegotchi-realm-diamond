// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import {TestConstants} from "@test/constants.t.sol";
import {AlchemicaFacet} from "@contracts/RealmDiamond/facets/AlchemicaFacet.sol";
import {OwnershipFacet} from "@shared/OwnershipFacet.sol";
import {IDiamondCut} from "@interfaces/IDiamondCut.sol";
import {IERC20Extended} from "@interfaces/IERC20Extended.sol";
import {IERC20} from "@interfaces/IERC20.sol";

contract BatchtransferTests is Test {
  AlchemicaFacet alFacet;
  OwnershipFacet oFacet = OwnershipFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
  IDiamondCut dCut = IDiamondCut(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
  address diamondOwner;
  address alchOwner = 0x019Ed608dD806b80193942F2A960e7AC8aBb2EE3;

  function setUp() public {
    diamondOwner = OwnershipFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).owner();
    vm.startPrank(diamondOwner);
    alFacet = new AlchemicaFacet();

    //upgrade
    IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
    cut[0] = IDiamondCut.FacetCut({
      facetAddress: address(alFacet),
      action: IDiamondCut.FacetCutAction.Add,
      functionSelectors: populateBytes4Array(AlchemicaFacet.batchTransferTokens.selector)
    });

    dCut.diamondCut(cut, address(0), "");
    vm.stopPrank();
  }

  function testTransfers() public {
    //attempt to transfer 10 alchemica tokens out
    vm.startPrank(alchOwner);
    uint256 amount = 10e18;
    uint256[4] memory realmBalancesBefore = getBalances(alchOwner);
    address[4] memory a = AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    approve();
    AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).batchTransferTokens(
      populate2DAddress(a[0], a[1], a[2], a[3]),
      populate2DUINT(amount, amount, amount, amount),
      populateAddress(address(0xdead))
    );
    uint256[4] memory realmBalancesAfter = getBalances(alchOwner);
    for (uint256 i; i < 4; i++) {
      assertEq(realmBalancesBefore[i], realmBalancesAfter[i] + amount);
    }
    vm.stopPrank();
  }

  function testFailTransfers() public {
    vm.startPrank(alchOwner);
    uint256 amount = 10e18;
    address[4] memory a = AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    approve();
    AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).batchTransferTokens(
      populate2DAddress(a[0], a[1], a[2], a[3]),
      populate2DUINT(amount, amount, amount, 1000000000000000000000e18),
      populateAddress(address(0xdead))
    );
  }

  function getBalances(address user) public view returns (uint256[4] memory balances) {
    address[4] memory alchemicaAddresses = AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    for (uint256 i = 0; i < 4; i++) {
      balances[i] = IERC20(alchemicaAddresses[i]).balanceOf(user);
    }
  }

  function approve() public {
    address[4] memory alchemicaAddresses = AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    for (uint256 i = 0; i < 4; i++) {
      IERC20(alchemicaAddresses[i]).approve(TestConstants.REALM_DIAMOND_ADDRESS_MATIC, 10000e18);
    }
  }
}

function populateBytes4Array(bytes4 _no) pure returns (bytes4[] memory a) {
  a = new bytes4[](1);
  a[0] = _no;
}

function populate2DUINT(
  uint256 _no,
  uint256 _no2,
  uint256 _no3,
  uint256 _no4
) pure returns (uint256[][] memory) {
  uint256[][] memory arr = new uint256[][](1);
  uint256[] memory arr1 = new uint256[](4);
  arr1[0] = _no;
  arr1[1] = _no2;
  arr1[2] = _no3;
  arr1[3] = _no4;
  arr[0] = arr1;
  return arr;
}

function populate2DAddress(
  address _add,
  address _add2,
  address _add3,
  address _add4
) pure returns (address[][] memory) {
  address[][] memory arr = new address[][](1);
  address[] memory arr1 = new address[](4);
  arr1[0] = _add;
  arr1[1] = _add2;
  arr1[2] = _add3;
  arr1[3] = _add4;
  arr[0] = arr1;
  return arr;
}

function populateAddress(address _add) pure returns (address[] memory) {
  address[] memory arr = new address[](1);
  arr[0] = _add;
  return arr;
}
