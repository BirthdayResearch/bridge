interface TooltipInfoI {
  title: string;
  content: string;
}

export const CONSORTIUM_INFO: TooltipInfoI = {
  title: "DeFiChain Consortium",
  content:
    "DeFiChain members that have been given the rights to mint and burn the Tokenized Assets on DeFiChain.",
};

export const FEES_INFO: TooltipInfoI = {
  title: "Fees",
  content:
    "Fees to cover the cost of transactions on DeFiChain and Ethereum networks. For more information, visit our user guide.",
};

export const TOKEN_SUPPLY_INFO: TooltipInfoI = {
  title: "Token Supply",
  content:
    "Token supply indicates the amount of liquidity currently available for a particular token pair on DeFiChain Bridge",
};

export const DAILY_LIMIT_INFO: TooltipInfoI = {
  title: "Daily Limit",
  content:
    "DeFiChain Bridge has a daily hard cap for each token pair. Once this limit is reached, you will not be able to transfer to DeFiChain or Ethereum until the next day.",
};

export const TRANSACTION_ERROR_INFO: TooltipInfoI = {
  title: "Transaction Error",
  content:
    "In case of any transaction errors, we will fully refund your dTokens to the below address.",
};

export const DISCLAIMER_MESSAGE =
  "Transactions are irreversible. Make sure that you send the exact amount to the correct destination address for your DeFiChain wallet.";

export const DFC_TO_API_RESET_TIME_LIMIT = 1000 * 60; // 1 min api reset time

export const DFC_TO_ERC_RESET_FORM_TIME_LIMIT = 1000 * 60 * 60 * 24; // 1 Day address expiry time

export const STORAGE_TXN_KEY = "unconfirmed-txn";
export const STORAGE_UNCONFIRMED_TXN_HASH_KEY = "unconfirmed-txn-hash";
export const STORAGE_CONFIRMED_TXN_HASH_KEY = "confirmed-txn-hash";

export enum BridgeStatus {
  IsTokenApprovalInProgress = 0,
  IsTokenApproved = 1,
  IsTokenRejected = 2,
  NoTxCreated = 3,
  TxHashBridgetoDfcError = 4,
}

export const STORAGE_DFC_ADDR_KEY = "unconfirmed-txn-dfc-address";

export const ETHEREUM_SYMBOL = "ETH";
