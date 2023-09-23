// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";

contract NFTDisplayFacet is Modifiers {
  event NFTDisplayStatusUpdated(address _token, uint256 _chainId, bool _allowed);
  error LengthMisMatch();

  ///@notice Allow the Diamond owner to toggle whether or not an NFT collection is allowed to be displayed on the gotchiverse
  ///@param _tokens The addresses of the NFT collections
  ///@param _chainIds The respective chainIds of the NFT collections
  ///@param _allow Whether or not the NFT collections are allowed to be displayed on the gotchiverse
  function toggleNftDisplayAllowed(address[] calldata _tokens, uint256[] calldata _chainIds, bool[] calldata _allow) external onlyOwner {
    if (_tokens.length != _chainIds.length && _tokens.length != _allow.length) revert LengthMisMatch();
    for (uint256 i; i < _tokens.length; i++) {
      address token = _tokens[i];
      uint256 chainId = _chainIds[i];
      bool whitelist = _allow[i];

      s.nftDisplayAllowed[chainId][token] = whitelist;
      emit NFTDisplayStatusUpdated(token, chainId, whitelist);
    }
  }

  ///@notice View whether or not an NFT collection is allowed to be displayed on the gotchiverse
  ///@param _token The address of the NFT collection
  ///@param _chainId The chainId of the NFT collection
  function nftDisplayAllowed(address _token, uint256 _chainId) public view returns (bool) {
    return s.nftDisplayAllowed[_chainId][_token];
  }
}
