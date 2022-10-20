// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";

contract SetPubKeyFacet is Modifiers {
  function setPubKey(bytes memory _newPubKey) public {
    s.backendPubKey = _newPubKey;
  }
}
