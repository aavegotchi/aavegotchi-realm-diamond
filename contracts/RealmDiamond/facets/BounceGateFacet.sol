// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibBounceGate.sol";

contract BounceGateFacet is Modifiers {
  function createEvent(
    string calldata _title,
    uint64 _startTime,
    uint64 _durationInMinutes,
    uint256[4] calldata _alchemicaSpent,
    uint256 _realmId
  ) external {
    LibBounceGate._createEvent(_title, _startTime, _durationInMinutes, _alchemicaSpent, _realmId);
  }

  function updateEvent(
    uint256 _realmId,
    uint256[4] calldata _alchemicaSpent,
    uint40 _durationExtensionInMinutes
  ) external {
    LibBounceGate._updateEvent(_realmId, _alchemicaSpent, _durationExtensionInMinutes);
  }

  function viewEvent(uint256 _realmId) public view returns (BounceGate memory) {
    return s.parcels[_realmId].bounceGate;
  }
}
