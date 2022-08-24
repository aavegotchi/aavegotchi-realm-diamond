// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";

contract NFTDisplayFacet is Modifiers {
  event NFTDisplayStatusUpdated(address _token, uint256 _chainId, bool _allowed);
  //  event NFTBlacklisted(address _token, uint256 _chainId);
  error LengthMisMatch();

  function whitelistNFTs(address[] calldata _tokens, uint256[] calldata _chainIds) external onlyOwner {
    if (_tokens.length != _chainIds.length) revert LengthMisMatch();
    for (uint256 i; i < _tokens.length; i++) {
      s.allowedNFTDisplays[_chainIds[i]][_tokens[i]] = true;
      emit NFTDisplayStatusUpdated(_tokens[i], _chainIds[i], true);
    }
  }

  function blacklistNFTs(address[] calldata _tokens, uint256[] calldata _chainIds) external onlyOwner {
    if (_tokens.length != _chainIds.length) revert LengthMisMatch();
    for (uint256 i; i < _tokens.length; i++) {
      s.allowedNFTDisplays[_chainIds[i]][_tokens[i]] = false;
      emit NFTDisplayStatusUpdated(_tokens[i], _chainIds[i], false);
    }
  }

  function viewNFTDisplayStatus(address _token, uint256 _chainId) public view returns (bool) {
    return s.allowedNFTDisplays[_chainId][_token];
  }
}
