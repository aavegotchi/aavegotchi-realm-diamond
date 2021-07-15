interface AuctionConfig {
  // a identifier helpful for humans
  id: string;
  ercType: number;

  // auction params
  auctionCount: number;
  // if prexisiting listing
  initialIndex: number;

  //
  token: string;
  tokenId: number; // index to start auctioning from if 721
  // or its the wearables id if erc 1155

  // gbm deployment params
  gbm: string;
  gbmInitiator: string;
}

// export default <AuctionConfig>{
//   id: "auction-haunt2-test", // huamn id
//   auctionCount: 502, // number of auctions to make
//   initialIndex: 0, // none previous, so start at 0
//   ercType: 1155,
//   tokenId: 18, // if erc721, tokenId == 0
//   skip: 0,
//   token: "", // if erc
//   gbmInitiator: "",
//   gbm: "",
// };

export default <AuctionConfig>{
  id: "auction-haunt2-test", // huamn id
  auctionCount: 10, // number of auctions to make
  initialIndex: 0, // none previous, so start at 0
  ercType: 721,
  tokenId: 0, // if erc721, tokenId == 0
  skip: 0,
  token: "", // if erc
  gbmInitiator: "",
  gbm: "",
};

// const erc721 = <AuctionConfig>{
//   id: "auction-haunt2-test", // huamn id
//   auctionCount: 1000, // number of auctions to make
//   initialIndex: 0, // none previous, so start at 0
//   token: "", // if erc
//   ercType: 721,
//   tokenId: 0,
//   gbmInitiator: "",
//   gbm: "",
// };
//
// const erc1155 = <AuctionConfig>{
//   id: "auction-wearable-test", // huamn id
//   auctionCount: 1000, // number of auctions to make
//   initialIndex: 0, // none previous, so start at 0
//   token: "", // if erc
//   ercType: 1155,
//   tokenId: 100,
//   gbmInitiator: "",
//   gbm: "",
// };
