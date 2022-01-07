# VRFConsumerBaseV2





****************************************************************************Interface for contracts using VRF randomness *****************************************************************************

*PURPOSEReggie the Random Oracle (not his real job) wants to provide randomnessto Vera the verifier in such a way that Vera can be sure he&#39;s notmaking his output up to suit himself. Reggie provides Vera a public keyto which he knows the secret key. Each time Vera provides a seed toReggie, he gives back a value which is computed completelydeterministically from the seed and the secret key.Reggie provides a proof by which Vera can verify that the output wascorrectly computed once Reggie tells it to her, but without that proof,the output is indistinguishable to her from a uniform random samplefrom the output space.The purpose of this contract is to make it easy for unrelated contractsto talk to Vera the verifier about the work Reggie is doing, to providesimple access to a verifiable source of randomness. It ensures 2 things:1. The fulfillment came from the VRFCoordinator2. The consumer contract implements fulfillRandomWords. *****************************************************************************USAGECalling contracts must inherit from VRFConsumerBase, and caninitialize VRFConsumerBase&#39;s attributes in their constructor asshown:contract VRFConsumer {constuctor(&lt;other arguments&gt;, address _vrfCoordinator, address _link)VRFConsumerBase(_vrfCoordinator) public {&lt;initialization with other arguments goes here&gt;}}The oracle will have given you an ID for the VRF keypair they havecommitted to (let&#39;s call it keyHash). Create subscription, fund itand your consumer contract as a consumer of it (see VRFCoordinatorInterfacesubscription management functions).Call requestRandomWords(keyHash, subId, minimumRequestConfirmations,callbackGasLimit, numWords),see (VRFCoordinatorInterface for a description of the arguments).Once the VRFCoordinator has received and validated the oracle&#39;s responseto your request, it will call your contract&#39;s fulfillRandomWords method.The randomness argument to fulfillRandomWords is a set of random wordsgenerated from your requestId and the blockHash of the request.If your contract could have concurrent requests open, you can use therequestId returned from requestRandomWords to track which response is associatedwith which randomness request.See &quot;SECURITY CONSIDERATIONS&quot; for principles to keep in mind,if your contract could have multiple requests in flight simultaneously.Colliding `requestId`s are cryptographically impossible as long as seedsdiffer. *****************************************************************************SECURITY CONSIDERATIONSA method with the ability to call your fulfillRandomness method directlycould spoof a VRF response with any random value, so it&#39;s critical thatit cannot be directly called by anything other than this base contract(specifically, by the VRFConsumerBase.rawFulfillRandomness method).For your users to trust that your contract&#39;s random behavior is freefrom malicious interference, it&#39;s best if you can write it so that allbehaviors implied by a VRF response are executed *during* yourfulfillRandomness method. If your contract must store the response (oranything derived from it) and use it later, you must ensure that anyuser-significant behavior which depends on that stored value cannot bemanipulated by a subsequent VRF request.Similarly, both miners and the VRF oracle itself have some influenceover the order in which VRF responses appear on the blockchain, so ifyour contract could have multiple VRF requests in flight simultaneously,you must ensure that the order in which the VRF responses arrive cannotbe used to manipulate your contract&#39;s user-significant behavior.Since the block hash of the block which contains the requestRandomnesscall is mixed into the input to the VRF *last*, a sufficiently powerfulminer could, in principle, fork the blockchain to evict the blockcontaining the request, forcing the request to be included in adifferent block with a different hash, and therefore a different inputto the VRF. However, such an attack would incur a substantial economiccost. This cost scales with the number of blocks the VRF oracle waitsuntil it calls responds to a request. It is for this reason thatthat you can signal to an oracle you&#39;d like them to wait longer beforeresponding to the request (however this is not enforced in the contractand so remains effective only in the case of unmodified oracle software).*

## Methods

### rawFulfillRandomWords

```solidity
function rawFulfillRandomWords(uint256 requestId, uint256[] randomWords) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| requestId | uint256 | undefined
| randomWords | uint256[] | undefined




## Errors

### OnlyCoordinatorCanFulfill

```solidity
error OnlyCoordinatorCanFulfill(address have, address want)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| have | address | undefined |
| want | address | undefined |


