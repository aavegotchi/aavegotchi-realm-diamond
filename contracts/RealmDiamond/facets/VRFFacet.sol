// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../libraries/LibERC721.sol";
import "../../libraries/LibRealm.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract VRFFacet is Modifiers {
  function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
    require(LibMeta.msgSender() == s.vrfCoordinator, "Only VRFCoordinator can fulfill");
    uint256 tokenId = s.vrfRequestIdToTokenId[requestId];
    LibRealm.updateRemainingAlchemica(tokenId, randomWords, s.vrfRequestIdToSurveyingRound[requestId]);
  }

  function setConfig(RequestConfig calldata _requestConfig, address _vrfCoordinator) external onlyOwner {
    s.vrfCoordinator = _vrfCoordinator;
    s.requestConfig = RequestConfig(
      _requestConfig.subId,
      _requestConfig.callbackGasLimit,
      _requestConfig.requestConfirmations,
      _requestConfig.numWords,
      _requestConfig.keyHash
    );
  }

  function subscribe() external onlyOwner {
    address[] memory consumers = new address[](1);
    consumers[0] = address(this);
    s.requestConfig.subId = VRFCoordinatorV2Interface(s.vrfCoordinator).createSubscription();
    VRFCoordinatorV2Interface(s.vrfCoordinator).addConsumer(s.requestConfig.subId, consumers[0]);
  }

  // Assumes this contract owns link
  function topUpSubscription(uint256 amount) external {
    LinkTokenInterface(s.linkAddress).transferAndCall(s.vrfCoordinator, amount, abi.encode(s.requestConfig.subId));
  }
}
