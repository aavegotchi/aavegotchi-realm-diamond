// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface RealmDiamond {
  function getAlchemicaAddresses() external view returns (address[4] memory);
}
