import { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import * as ethers from "ethers";
import { FiClipboard } from "react-icons/fi";
import { IoCloseCircle } from "react-icons/io5";
import { fromAddress } from "@defichain/jellyfish-address";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import useResponsive from "@hooks/useResponsive";
import useAutoResizeTextArea from "@hooks/useAutoResizeTextArea";
import { Network } from "types";
import Tooltip from "./commons/Tooltip";
import EnvironmentNetworkSwitch from "./EnvironmentNetworkSwitch";

interface Props {
  blockchain: Network;
  label: string;
  disabled?: boolean;
}

const blockchainNameMap: Record<Network, string> = {
  DeFiChain: "DeFiChain",
  Ethereum: "ERC20",
};

export default function WalletAddressInput({
  blockchain,
  label,
  disabled = false,
}: Props): JSX.Element {
  const [addressInput, setAddressInput] = useState<string>("");
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [placeholder, setPlaceholder] = useState<string>("");
  const [error, setError] = useState({ message: "", isError: false });
  const [copiedFromClipboard, setCopiedFromClipboard] = useState(false);

  const { networkEnv, networkEnvDisplayName } = useNetworkEnvironmentContext();
  const { isMd } = useResponsive();
  useAutoResizeTextArea(textAreaRef.current, [addressInput, placeholder]);

  const validateAddressInput = (input: string): void => {
    let isValid = false;
    if (blockchain === Network.Ethereum) {
      isValid = ethers.utils.isAddress(input);
    } else {
      const decodedAddress = fromAddress(input, networkEnv);
      isValid = decodedAddress !== undefined;
    }
    setIsValidAddress(isValid);
  };

  const handlePasteBtnClick = async () => {
    if (disabled) return;
    const copiedText = await navigator.clipboard.readText();
    if (copiedText) {
      setAddressInput(copiedText);
      setCopiedFromClipboard(true);
    }
  };

  const handleFocusWithCursor = () => {
    setIsFocused(true);
    setTimeout(() => {
      // Only added timeout for ref's unexplained delay
      const textArea = textAreaRef.current;
      const cursorPosition = addressInput.length;
      if (textArea) {
        textArea.setSelectionRange(cursorPosition, cursorPosition);
        textArea.focus();
      }
    }, 0);
  };

  useEffect(() => {
    const displayedName = blockchainNameMap[blockchain];
    if (networkEnv === "testnet" && blockchain === Network.DeFiChain) {
      setPlaceholder(
        `Enter ${displayedName} (${networkEnvDisplayName}) address`
      );
    } else {
      setPlaceholder(`Enter ${displayedName} address`);
    }
    setAddressInput(""); // Reset input on network change
  }, [blockchain, networkEnv]);

  useEffect(() => {
    if (addressInput === "") {
      setIsValidAddress(false);
      return;
    }
    validateAddressInput(addressInput);
  }, [addressInput, networkEnv, blockchain]);

  useEffect(() => {
    let message: string;
    const isDeFiChain = blockchain === "DeFiChain";
    const hasInvalidInput = !!(addressInput && !isValidAddress);
    if (hasInvalidInput) {
      const dfiNetwork = isDeFiChain ? ` ${networkEnvDisplayName}` : "";
      message = `Use correct address for ${blockchainNameMap[blockchain]}${dfiNetwork}`;
    } else {
      const isTestnet = isDeFiChain && networkEnv === "testnet";
      message = isTestnet ? "Make sure to only use TestNet for testing" : "";
    }
    setError({ message, isError: hasInvalidInput });
  }, [addressInput, isValidAddress, blockchain, networkEnv]);

  useEffect(() => {
    if (copiedFromClipboard) {
      setTimeout(() => setCopiedFromClipboard(false), 2000);
    }
  }, [copiedFromClipboard]);

  const showErrorBorder = addressInput && !isValidAddress;
  const showVerifiedBadge = isValidAddress && !isFocused;
  return (
    <>
      {/* Address label */}
      <div className="h-5 lg:h-7 group relative mb-2 flex items-center lg:mb-3">
        <span className="pl-5 text-xs font-semibold xl:tracking-wider lg:text-base text-dark-900">
          {label}
        </span>
        {blockchain === Network.DeFiChain && <EnvironmentNetworkSwitch />}
        <div
          className={clsx(
            "absolute right-0 rounded bg-valid px-2 py-1 text-2xs text-dark-00  transition duration-300 lg:text-xs",
            copiedFromClipboard ? "opacity-100" : "opacity-0"
          )}
        >
          Added from clipboard
        </div>
      </div>

      {/* Main wallet input container */}
      <div
        className={clsx(
          "relative flex min-h-[48px] items-center rounded-lg border py-2.5 pr-3.5 pl-4 lg:px-5 lg:py-[21px]",
          {
            "bg-dark-100 opacity-30": disabled,
            "border-error": showErrorBorder,
            "before:dark-gradient-2 z-0 border-transparent before:-inset-[1px] before:rounded-lg before:p-px":
              isFocused && !showErrorBorder,
            "border-dark-300 hover:border-dark-500": !(
              disabled ||
              showErrorBorder ||
              isFocused
            ),
          }
        )}
      >
        {/* Paste icon with tooltip */}
        <Tooltip
          content="Paste from clipboard"
          containerClass={clsx("mr-3 lg:mr-6 shrink-0", {
            "cursor-pointer hover:bg-dark-200 active:dark-btn-pressed":
              !disabled,
          })}
          disableTooltip={disabled || !isMd} // Disable tooltip for mobile
        >
          <FiClipboard
            size={20}
            className="text-dark-1000"
            onMouseDown={handlePasteBtnClick}
          />
        </Tooltip>

        {/* Copy of textarea */}
        {showVerifiedBadge && (
          <AddressWithVerifiedBadge
            value={addressInput}
            onClick={handleFocusWithCursor}
          />
        )}

        {/* Textarea input */}
        <textarea
          ref={textAreaRef}
          className={clsx(
            `w-full max-h-36 grow resize-none bg-transparent text-sm tracking-[0.01em] text-dark-1000 placeholder:text-sm focus:outline-none lg:text-xl lg:placeholder:text-xl`,
            { hidden: showVerifiedBadge },
            isFocused
              ? "placeholder:text-dark-300"
              : "placeholder:text-dark-500"
          )}
          placeholder={placeholder}
          value={addressInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          disabled={disabled}
          spellCheck={false}
        />

        {/* Clear icon */}
        {((isFocused && addressInput) || (addressInput && !isValidAddress)) && (
          <IoCloseCircle
            size={20}
            className="ml-4 mr-1 shrink-0 cursor-pointer fill-dark-500"
            onMouseDown={() => {
              setAddressInput("");
              handleFocusWithCursor();
            }}
          />
        )}
      </div>

      {/* Error and warning messages */}
      <span
        className={clsx(
          "block px-4 pt-2 text-xs lg:px-6 lg:text-sm empty:before:content-['*'] empty:before:opacity-0",
          error.isError ? "text-error" : "text-warning"
        )}
      >
        {error.message && !disabled ? error.message : ""}
      </span>
    </>
  );
}

/**
 * Displays wallet address with verified badge
 * Acts like a 'clone' for textarea, since ::after pseudo doesnt work for textarea
 * When displayed, textarea is hidden
 */
function AddressWithVerifiedBadge({
  value,
  onClick,
}: {
  value: string;
  onClick: () => void;
}): JSX.Element {
  const { isLg } = useResponsive();
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "relative mr-10 w-full break-all bg-transparent text-sm text-dark-1000 after:absolute focus:outline-none lg:text-xl",
        isLg
          ? "after:-bottom-1 after:ml-2 after:content-[url('/verified-24x24.svg')]"
          : "after:ml-1 after:content-[url('/verified-20x20.svg')]"
      )}
      onClick={() => onClick()}
    >
      {value}
    </div>
  );
}
