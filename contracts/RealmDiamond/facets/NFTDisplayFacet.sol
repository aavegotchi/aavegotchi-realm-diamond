// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";

contract NFTDisplayFacet is Modifiers {
  event NFTDisplayStatusUpdated(address _token, uint256 _chainId, bool _allowed);
  //  event NFTBlacklisted(address _token, uint256 _chainId);
  error LengthMisMatch();

  function toggleWhitelist(
    address[] calldata _tokens,
    uint256[] calldata _chainIds,
    bool[] calldata _whitelist
  ) external onlyOwner {
    if (_tokens.length != _chainIds.length && _tokens.length != _whitelist.length) revert LengthMisMatch();
    for (uint256 i; i < _tokens.length; i++) {
      address token = _tokens[i];
      uint256 chainId = _chainIds[i];
      bool whitelist = _whitelist[i];

      s.allowedNFTDisplays[chainId][token] = whitelist;
      emit NFTDisplayStatusUpdated(token, chainId, whitelist);
    }
  }

  function viewNFTDisplayStatus(address _token, uint256 _chainId) public view returns (bool) {
    return s.allowedNFTDisplays[_chainId][_token];
  }
}
