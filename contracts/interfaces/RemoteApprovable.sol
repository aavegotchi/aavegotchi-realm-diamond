// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface RemoteApprovable {
  function approveRemote(address _owner, address _spender, uint256 _amount) external;
}