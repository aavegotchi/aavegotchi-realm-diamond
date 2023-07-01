// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAlchemicaHook {
  function onAlchemicaChanneled(
    uint256 _realmId,
    uint256 _gotchiId,
    address[4] memory _tokens,
    uint256[4] memory _values
  ) external returns (bytes4);
}
