export interface ERC1155Config {
  id?: string;
  auctions?: Object;
  gbm?: string;
  gbmInitiator?: string;
  token?: string;
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
    gasGwei: 5,
    release: false,
  },
  hardhat: {
    gbm: "",
    gbmInitiator: "",
    token: "",
  },
  kovan: {
    id: "auction-kovan-megasrs-launch",
    gbm: "a",
    gbmInitiator: "b",
    token: "c",
    gasGwei: 2,
    release: true,
  },
  // real main kovan
  // kovan: {
  // gbm: "",
  // gbmInitiator: "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5",
  // token: "0x07543dB60F19b9B48A69a7435B5648b46d4Bb58E",
  // release: true // confirms you really want to deploy using non-dummy addresses
  // }
  // polygon: {
  //   gbm: "",
  //   gbmInitiator: "",
  //   token: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
  //   gasGwei: 30,
  //   release: true
  // },
};
