import clsx from "clsx";
import { RiLoader2Line } from "react-icons/ri";
import { FiRefreshCw } from "react-icons/fi";

export default function ActionButton({
  label,
  onClick,
  disabled = false,
  isLoading = false,
  isRefresh = false,
  variant = "primary",
  responsiveStyle,
  testId,
  customStyle,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary";
  responsiveStyle?: string;
  testId?: string;
  customStyle?: string;
  isRefresh?: boolean;
}) {
  const isPrimary = variant === "primary";
  const responsiveSizing =
    responsiveStyle ?? "text-sm md:p-2.5 lg:text-base lg:p-4";
  return (
    <button
      data-testid={testId ?? "action-btn"}
      type="button"
      className={clsx(
        "w-full flex items-center justify-center rounded-[92px] font-bold p-3",
        "focus-visible:outline-none disabled:opacity-30",
        responsiveSizing,
        isPrimary
          ? "text-dark-100 hover:dark-cta-hover active:dark-cta-pressed bg-dark-1000"
          : "text-dark-1000 hover:dark-btn-hover active:dark-btn-pressed",
        {
          "dark-cta-pressed": isLoading,
          "pointer-events-none": disabled || isLoading,
        },
        customStyle
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
      {isLoading && (
        <RiLoader2Line
          size={24}
          className="inline-block animate-spin text-dark-100 ml-2"
        />
      )}
      {isRefresh && (
        <FiRefreshCw size={16} className="text-dark-100 ml-2 inline-block" />
      )}
    </button>
  );
}
