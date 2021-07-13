interface AuctionConfig {
  id: string;
  ercType: number;

  // auction params
  auctionCount: number;
  // if prexisiting listing
  initialIndex: number;
  priceFloor: number;

  token: string;
  tokenId: number;

  // gbm deployment params
  gbm: string;
  gbmInitiator: string;
}

export default <AuctionConfig>{
  id: "auction-wearable-test",
  auctionCount: 100,
  initialIndex: 0, // none previous, so start at 0
  ercType: 1155,
  tokenId: 0, // itemId
  token: "", // address of erc1155 contract
  gbmInitiator: "", // address
  gbm: "", // address
  priceFloor: 0, // @todo
};
