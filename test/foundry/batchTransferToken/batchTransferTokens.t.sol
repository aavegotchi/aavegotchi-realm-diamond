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
  }

  function testTransfers() public {
    //attempt to transfer 10 alchemica tokens out
    uint256 amount = 10e18;
    uint256[4] memory realmBalancesBefore = getBalances(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
    address[4] memory a = AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).batchTransferTokens(
      populateAddress(a[0], a[1], a[2], a[3]),
      populateUINT(amount, amount, amount, amount),
      address(0xdead)
    );
    uint256[4] memory realmBalancesAfter = getBalances(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
    for (uint256 i; i < 4; i++) {
      assertEq(realmBalancesBefore[i], realmBalancesAfter[i] + amount);
    }
  }

  event ERC20ErrorHandled(string _tokenName);

  function testFailTransfers() public {
    uint256 amount = 10e18;
    address[4] memory a = AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    //kek transfer will fail, but others will pass
    emit ERC20ErrorHandled(IERC20Extended(a[3]).name());
    vm.expectEmit(true, false, false, false, TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
    AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).batchTransferTokens(
      populateAddress(a[0], a[1], a[2], a[3]),
      populateUINT(amount, amount, amount, 1000000000000000000000e18),
      address(0xdead)
    );
  }

  function getBalances(address user) public view returns (uint256[4] memory balances) {
    address[4] memory alchemicaAddresses = AlchemicaFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).getAlchemicaAddresses();
    for (uint256 i = 0; i < 4; i++) {
      balances[i] = IERC20(alchemicaAddresses[i]).balanceOf(user);
    }
  }
}

function populateBytes4Array(bytes4 _no) pure returns (bytes4[] memory a) {
  a = new bytes4[](1);
  a[0] = _no;
}

function populateUINT(
  uint256 _no,
  uint256 _no2,
  uint256 _no3,
  uint256 _no4
) pure returns (uint256[] memory) {
  uint256[] memory arr = new uint256[](4);
  arr[0] = _no;
  arr[1] = _no2;
  arr[2] = _no3;
  arr[3] = _no4;
  return arr;
}

function populateAddress(
  address _add,
  address _add2,
  address _add3,
  address _add4
) pure returns (address[] memory) {
  address[] memory arr = new address[](4);
  arr[0] = _add;
  arr[1] = _add2;
  arr[2] = _add3;
  arr[3] = _add4;
  return arr;
}
