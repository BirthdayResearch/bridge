import clsx from "clsx";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { NetworkEnvironment } from "types";

export default function EnvironmentNetworkSwitch(): JSX.Element {
  const {
    networkEnv: currentNetworkEnv,
    networkEnvDisplayName,
    updateNetworkEnv,
  } = useNetworkEnvironmentContext();

  const handleOnClick = () => {
    let nextNetworkEnv: NetworkEnvironment;
    switch (currentNetworkEnv) {
      case NetworkEnvironment.testnet:
        nextNetworkEnv =
          process.env.NODE_ENV === "production"
            ? NetworkEnvironment.mainnet
            : NetworkEnvironment.local;
        break;
      case NetworkEnvironment.local:
        nextNetworkEnv = NetworkEnvironment.mainnet;
        break;
      case NetworkEnvironment.mainnet:
      default:
        nextNetworkEnv = NetworkEnvironment.testnet;
        break;
    }
    updateNetworkEnv(nextNetworkEnv);
  };

  return (
    <button
      type="button"
      className="flex items-center rounded-[37px] dark-section-bg border border-dark-card-stroke px-2 py-1 lg:px-3 lg:py-2 ml-2 hover:dark-btn-hover hover:border-dark-500"
      onClick={handleOnClick}
    >
      <div
        className={clsx(
          "w-2 h-2 rounded-full mr-1",
          currentNetworkEnv === NetworkEnvironment.mainnet
            ? "bg-valid"
            : "bg-warning"
        )}
      />
      <span className="text-dark-1000 text-2xs font-bold tracking-widest uppercase">
        {networkEnvDisplayName}
      </span>
    </button>
  );
}
