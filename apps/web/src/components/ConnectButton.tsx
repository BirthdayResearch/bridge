import clsx from "clsx";
import { useNetwork } from "wagmi";
import { ConnectKitButton } from "connectkit";
import useResponsive from "@hooks/useResponsive";
import truncateTextFromMiddle from "@utils/textHelper";
import MetaMaskIcon from "./icons/MetaMaskIcon";

function PreConnectedButton({
  onClick,
}: {
  onClick: (() => void) | undefined;
}): JSX.Element {
  const { isMd } = useResponsive();
  const btnLabel = isMd ? "Connect wallet" : "Connect";
  return (
    <button
      data-testid="connect-button"
      type="button"
      className={clsx(
        `dark-bg-gradient-1 hover:fill-bg-gradient-1 active:fill-bg-gradient-5 flex h-full items-center justify-center
            rounded-3xl border-[1.5px] border-transparent px-4 py-2 md:px-6
            md:py-2.5 lg:px-6 lg:py-3`
      )}
      onClick={onClick}
    >
      <span className="text-sm font-semibold text-dark-1000">{btnLabel}</span>
    </button>
  );
}

function ConnectedButton({
  address,
  chain,
  onClick,
}: {
  address: string;
  chain: string;
  onClick: (() => void) | undefined;
}): JSX.Element {
  const { isLg } = useResponsive();
  const walletText = truncateTextFromMiddle(address, isLg ? 5 : 4);
  return (
    <button
      data-testid="wallet-button"
      type="button"
      onClick={onClick}
      className={clsx(
        `hover:dark-btn-hover active:dark-btn-pressed dark-card-bg flex h-8 items-center rounded-[48px]
        border-[0.5px] border-dark-card-stroke px-3 py-2 hover:border-transparent md:h-[52px] md:w-[156px] lg:h-12 lg:w-[165px] lg:px-2.5 lg:py-1.5`
      )}
    >
      <div className="hidden md:flex items-center">
        <MetaMaskIcon />
        <div className="ml-2 text-left">
          <span className="block text-sm text-dark-1000">{walletText}</span>
          <div className="flex items-center">
            <span className="text-xs text-dark-700">{chain}</span>
            <div className="ml-1 h-2 w-2 rounded-full bg-valid" />
          </div>
        </div>
      </div>
      <div className="flex md:hidden">
        <div className="mr-2 h-3 w-3 rounded-full bg-valid" />
        <span className="text-xs text-dark-1000">{walletText}</span>
      </div>
    </button>
  );
}

export default function ConnectButton() {
  const { chain } = useNetwork();

  return (
    <ConnectKitButton.Custom>
      {({ isConnected, address, show }) =>
        isConnected ? (
          <ConnectedButton
            address={address as string}
            chain={chain?.name as string}
            onClick={show}
          />
        ) : (
          <PreConnectedButton onClick={show} />
        )
      }
    </ConnectKitButton.Custom>
  );
}
