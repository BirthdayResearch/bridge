import { ContractContextI } from "types";
import BridgeV1 from "./ABIs/mainnet/BridgeV1.json";
import BridgeV1Testnet from "./ABIs/testnet/BridgeV1.json";

export const MAINNET_CONFIG: ContractContextI = {
  EthereumRpcUrl:
    "https://mainnet.infura.io/v3/df267399d98e41e996d6588a76678d5e",
  ExplorerURL: "https://etherscan.io",
  BridgeV1: {
    address: "0x54346d39976629b65ba54eac1c9ef0af3be1921b",
    abi: BridgeV1,
  },
  Erc20Tokens: {
    WBTC: { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
    USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    ETH: { address: "0x0000000000000000000000000000000000000000" },
    EUROC: { address: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c" },
  },
};

// Goerli
export const TESTNET_CONFIG: ContractContextI = {
  EthereumRpcUrl: "https://rpc.ankr.com/eth_goerli",
  ExplorerURL: "https://goerli.etherscan.io",
  BridgeV1: {
    address: "0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef",
    abi: BridgeV1Testnet,
  },
  Erc20Tokens: {
    WBTC: { address: "0xD723D679d1A3b23d0Aafe4C0812f61DDA84fc043" },
    USDT: { address: "0xA218A0EA9a888e3f6E2dfFdf4066885f596F07bF" },
    USDC: { address: "0xB200af2b733B831Fbb3d98b13076BC33F605aD58" },
    ETH: { address: "0x0000000000000000000000000000000000000000" },
    EUROC: { address: "0x5ea4bbB3204522f3Ac65137D1E12027D9848231A" },
  },
};

// Local Hardhat
export const LOCAL_HARDHAT_CONFIG: ContractContextI = {
  EthereumRpcUrl: "http://127.0.0.1:8545",
  ExplorerURL: "https://goerli.etherscan.io",
  BridgeV1: {
    address: "0x96E5E1d6377ffA08B9c08B066f430e33e3c4C9ef",
    abi: BridgeV1Testnet,
  },
  Erc20Tokens: {
    WBTC: { address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" },
    USDT: { address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" },
    USDC: { address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" },
    ETH: { address: "0x0000000000000000000000000000000000000000" },
    EUROC: { address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" },
  },
};
