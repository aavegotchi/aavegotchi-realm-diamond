export interface ERC1155Config {
  id?: string;
  auctions?: Object;
  gbm: string;
  gbmInitiator: string;
  token: string;
  ghst?: string;
  gasGwei?: number;
  release?: boolean;
}

interface Config {
  default: ERC1155Config;
  hardhat?: ERC1155Config;
  kovan?: ERC1155Config;
  mumbai?: ERC1155Config;
  polygon?: ERC1155Config;
}

export default <Config>{
  default: {
    id: "auction-wearable-test",
    auctions: {
      // svgId: quanity of items to take from owner and regiser for auction
      204: 500, // Game Controller
      203: 250, // Gamer Jacket
      202: 50, // VR Headset

      200: 500, // Steampunk Trousers
      199: 250, // Steampunk Goggles
      201: 100, // Mechanical Claw

      205: 1000, // Gotchi Mug
    },
    //  gasGwei: 30,
    release: false,
    ghst: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    token: "",
    gbm: "",
    gbmInitiator: "",
  },
  hardhat: {
    gbm: "",
    gbmInitiator: "",
    token: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  },
  localhost: {
    gbm: "",
    gbmInitiator: "",
    token: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  },
  kovan: {
    id: "auction-kovan-megasrs-launch",
    gbm: "",
    gbmInitiator: "",
    token: "",
    ghst: "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5",
    gasGwei: 2,
    release: true,
  },
  matic: {
    id: "auction-wearables-1",
    gbm: "",
    gbmInitiator: "",
    token: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
    ghst: "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7",
    gasGwei: 30,
    release: true,
  },
  // mainnet kovan
  // kovan: {
  // gbm: "0xC025B341fF094958179d6acdddBD86042430DE1d",
  // gbmInitiator: "0x3EF3b22917D663ECE1896F98251fa44d96052e07",
  // token: "0x07543dB60F19b9B48A69a7435B5648b46d4Bb58E",
  // ghst: "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5",
  // gasGwei: 30,
  // release: true // confirm you really want to deploy using non-dummy addresses
  // }
};
