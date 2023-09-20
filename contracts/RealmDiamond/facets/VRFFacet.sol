// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibERC721.sol";
import "../../libraries/LibRealm.sol";

contract VRFFacet is Modifiers {
  function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
    // TODO: Deprecate
    require(LibMeta.msgSender() == s.vrfCoordinator, "Only VRFCoordinator can fulfill");
    uint256 tokenId = s.vrfRequestIdToTokenId[requestId];
    LibRealm.updateRemainingAlchemica(tokenId, randomWords, s.vrfRequestIdToSurveyingRound[requestId]);
  }

  function api3FulfillRandomWords(bytes32 requestId, bytes calldata data) external {
    require(LibMeta.msgSender() == s.api3AirnodeRrp, "Only API3 AirnodeRrp can fulfill");
    uint256 tokenId = s.api3QrngRequestIdToTokenId[requestId];
    uint256[] memory randomWords = abi.decode(data, (uint256[]));
    LibRealm.updateRemainingAlchemica(tokenId, randomWords, s.api3QrngRequestIdToSurveyingRound[requestId]);
  }

  function setApi3QrngConfig(Api3QrngConfig calldata _api3QrngConfig, address _api3AirnodeRrp) external onlyOwner {
    s.api3AirnodeRrp = _api3AirnodeRrp;
    s.api3QrngConfig = Api3QrngConfig(
      _api3QrngConfig.numWords,
      _api3QrngConfig.airnode,
      _api3QrngConfig.endpointId,
      _api3QrngConfig.sponsor,
      _api3QrngConfig.sponsorWallet
    );
  }
}
