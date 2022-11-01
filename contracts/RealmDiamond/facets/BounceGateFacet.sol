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

  function cancelEvent(uint256 _realmId) external {
    LibBounceGate._cancelEvent(_realmId);
  }

  function recreateEvent(
    uint256 _realmId,
    uint64 _startTime,
    uint64 _durationInMinutes,
    uint256[4] calldata _alchemicaSpent
  ) external {
    LibBounceGate._recreateEvent(_realmId, _startTime, _durationInMinutes, _alchemicaSpent);
  }

  function viewEvent(uint256 _realmId) public view returns (BounceGate memory b_) {
    BounceGate memory p = s.bounceGates[_realmId];
    b_.title = p.title;
    b_.startTime = p.startTime;
    b_.endTime = p.endTime;
    b_.priority = LibBounceGate._getUpdatedPriority(_realmId);
    b_.equipped = p.equipped;
    b_.lastTimeUpdated = p.lastTimeUpdated;
  }
}
