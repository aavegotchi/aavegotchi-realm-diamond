// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibBounceGate.sol";

contract BounceGateFacet is Modifiers {
  ///@notice Create an event in the gotchiverse
  ///@param _title The title of the event
  ///@param _startTime The start time of the event
  ///@param _durationInMinutes The duration of the event in minutes
  ///@param _alchemicaSpent The amount of alchemica spent on the event
  ///@param _realmId The parcelId where the event will take place
  function createEvent(
    string calldata _title,
    uint64 _startTime,
    uint64 _durationInMinutes,
    uint256[4] calldata _alchemicaSpent,
    uint256 _realmId
  ) external {
    LibBounceGate._createEvent(_title, _startTime, _durationInMinutes, _alchemicaSpent, _realmId);
  }

  ///@notice Update an ongoing event in the gotchiverse
  ///@param _realmId The parcelId where the event is taking place
  ///@param _alchemicaSpent The amount of alchemica spent on the event
  ///@param _durationExtensionInMinutes The amount of time to extend the event by

  function updateEvent(uint256 _realmId, uint256[4] calldata _alchemicaSpent, uint40 _durationExtensionInMinutes) external {
    LibBounceGate._updateEvent(_realmId, _alchemicaSpent, _durationExtensionInMinutes);
  }

  ///@notice Cancel a scheduled event in the gotchiverse
  ///@param _realmId The parcelId where the event was scheduled to take place
  function cancelEvent(uint256 _realmId) external {
    LibBounceGate._cancelEvent(_realmId);
  }

  ///@notice Recreate an event in the gotchiverse after it has ended with the same params
  ///@param _realmId The parcelId where the event took place
  ///@param _startTime The start time of the event
  ///@param _durationInMinutes The duration of the event in minutes
  ///@param _alchemicaSpent The amount of alchemica spent on the event

  function recreateEvent(uint256 _realmId, uint64 _startTime, uint64 _durationInMinutes, uint256[4] calldata _alchemicaSpent) external {
    LibBounceGate._recreateEvent(_realmId, _startTime, _durationInMinutes, _alchemicaSpent);
  }

  ///@notice View an event in the gotchiverse
  ///@param _realmId The parcelId where the event took place or is taking place or is scheduled to take place
  ///@return b_ The BounceGate struct
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
