import { ConnectKitButton } from "connectkit";
import { useRouter } from "next/router";
import { FiAlertCircle } from "react-icons/fi";
import { useAccount } from "wagmi";
import ActionButton from "./ActionButton";
import Modal from "./Modal";

export default function ErrorModal({
  title,
  message,
  primaryButtonLabel,
  onPrimaryButtonClick,
  onClose,
}: {
  title: string;
  message: string;
  primaryButtonLabel: string;
  onPrimaryButtonClick?: () => void;
  onClose: () => void;
}): JSX.Element {
  const router = useRouter();
  const { isConnected } = useAccount();

  return (
    <Modal isOpen onClose={onClose}>
      <div className="flex flex-col items-center mt-6 mb-14">
        <FiAlertCircle className="text-8xl text-error ml-1" />
        <span className="font-bold text-2xl text-dark-900 mt-12">{title}</span>
        <div className="w-full text-dark-900 text-center break-word mt-2 px-[29px]">
          {message}
        </div>
        <span className="pt-12">
          <ConnectKitButton.Custom>
            {({ show }) => (
              <ActionButton
                label={primaryButtonLabel}
                customStyle="md:px-6 text-xg lg:leading-8 lg:py-2 lg:px-8 xl:px-14"
                onClick={!isConnected ? show : onPrimaryButtonClick}
              />
            )}
          </ConnectKitButton.Custom>
          <ActionButton
            label="Close"
            variant="secondary"
            customStyle="mt-2 md:px-2.5 lg:text-xl lg:leading-8 lg:py-2 lg:px-8 xl:px-14"
            onClick={() => router.reload()}
          />
        </span>
      </div>
    </Modal>
  );
}
