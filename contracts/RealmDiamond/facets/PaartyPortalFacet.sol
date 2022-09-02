// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibPaartyPortal.sol";

contract PaartyPortalFacet is Modifiers {
  function createEvent(
    string calldata _title,
    uint64 _startTime,
    string calldata _mediaHash,
    uint64 _durationInMinutes,
    uint256[4] calldata _alchemicaSpent,
    uint256 _realmId
  ) external {
    LibPaartyPortal._createPaarty(_title, _startTime, _mediaHash, _durationInMinutes, _alchemicaSpent, _realmId);
  }

  function updateEvent(
    uint256 _realmId,
    uint256[4] calldata _alchemicaSpent,
    uint40 _durationExtensionInMinutes
  ) external {
    LibPaartyPortal._updatePaarty(_realmId, _alchemicaSpent, _durationExtensionInMinutes);
  }

  function viewEvent(uint256 _realmId) public view returns (Paarty memory) {
    return s.parcels[_realmId].paarty;
  }
}
