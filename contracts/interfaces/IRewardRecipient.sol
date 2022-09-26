pragma solidity 0.8.9;

import './IERC165.sol';

interface IRewardsRecipient is IERC165 {

    function onTokenGeneratingEvent(address[] calldata nftAddresses, uint256[] calldata tokenIds, address[] calldata paymentAddress, uint256[] calldata tokenAmount) external;

}
