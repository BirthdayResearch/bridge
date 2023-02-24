import BigNumber from "bignumber.js";
import { useNetworkContext } from "@contexts/NetworkContext";
import { Network } from "types";

/**
 * Computes transfer fee
 * Any changes to the fee logic can be updated here
 */

const EVM_TO_DFC_FEE_PERCENTAGE = 0.001;
const DFC_TO_EVM_FEE_PERCENTAGE = 0.003;
export default function useTransferFee(transferAmount: string | number) {
  const { selectedNetworkA, selectedTokensA } = useNetworkContext();
  const isSendingErcToken = selectedNetworkA.name === Network.Ethereum;
  const feeSymbol = selectedTokensA.tokenA.name;
  const fee = new BigNumber(transferAmount || 0).multipliedBy(
    isSendingErcToken ? EVM_TO_DFC_FEE_PERCENTAGE : DFC_TO_EVM_FEE_PERCENTAGE
  );

  return [fee, feeSymbol];
}
