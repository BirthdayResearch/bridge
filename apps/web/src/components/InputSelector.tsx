import clsx from "clsx";
import Image from "next/image";
import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { FaCheckCircle } from "react-icons/fa";
import { FiChevronDown, FiArrowRight } from "react-icons/fi";
import { Strategy } from "@floating-ui/react-dom";

export enum SelectionType {
  Network = "Network",
  Token = "Token",
}

export interface TokenDetailI {
  name: string;
  icon: string;
}

export interface TokensI {
  tokenA: TokenDetailI;
  tokenB: TokenDetailI;
}

export interface NetworkOptionsI extends TokenDetailI {
  tokens: TokensI[];
}

interface SelectorI {
  disabled?: boolean;
  label: string;
  type: SelectionType;
  popUpLabel: string;
  floatingObj: {
    floating: (node: HTMLElement | null) => void;
    strategy: Strategy;
    y: number | null;
  };
  options?: NetworkOptionsI[] | TokensI[];
  onSelect?: (value: any) => void;
  value: NetworkOptionsI | TokensI;
}

export function InputSelector({
  options,
  label,
  popUpLabel,
  onSelect,
  value,
  floatingObj,
  type,
  disabled = false,
}: SelectorI) {
  const { floating, y, strategy } = floatingObj;
  const roundedBorderStyle =
    type === SelectionType.Network ? "rounded-l-lg" : "rounded-r-lg";
  const { name, icon } =
    type === SelectionType.Network
      ? (value as NetworkOptionsI)
      : (value as TokensI).tokenA;
  return (
    <div>
      <span className="text-dark-900 pl-5 text-xs font-semibold lg:text-base">
        {label}
      </span>
      <Listbox value={value} onChange={onSelect}>
        {({ open }) => (
          <div className="relative mt-1">
            <Listbox.Button
              onClick={(event: { preventDefault: () => void }) => {
                if (disabled) {
                  event.preventDefault();
                }
              }}
              className={clsx(
                "relative w-full outline-0",
                disabled && "cursor-default",
                type === SelectionType.Network ? "p-px pr-0" : "p-px",
                open ? "bg-gradient-2 pr-px" : "bg-dark-200",
                roundedBorderStyle
              )}
            >
              <div
                className={clsx(
                  "bg-dark-100 dark-card-bg-image flex h-full w-full flex-row items-center justify-between py-3 pl-5 pr-3 text-left lg:px-5 lg:py-[18px]",
                  roundedBorderStyle
                )}
              >
                <div className="flex flex-row items-center">
                  <Image
                    width={100}
                    height={100}
                    src={icon}
                    alt={name}
                    data-testid={name}
                    className="h-6 w-6 lg:h-9 lg:w-9"
                  />
                  <span className="text-dark-1000 ml-2 block truncate text-sm lg:text-xl">
                    {name}
                  </span>
                </div>
                {!disabled && (
                  <span className="text-dark-900">
                    <FiChevronDown
                      className={clsx(
                        "text-dark-900 h-5 w-5 transition-[transform] lg:h-6 lg:w-6",
                        {
                          "rotate-180": open,
                        }
                      )}
                    />
                  </span>
                )}
              </div>
            </Listbox.Button>
            {!disabled && (
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options
                  ref={floating}
                  style={{
                    position: strategy,
                    top: y ?? "",
                  }}
                  className={clsx(
                    "absolute z-10 mt-2 w-full w-56 overflow-auto rounded-lg p-px outline-0",
                    { "right-0": type !== SelectionType.Network },
                    open ? "bg-gradient-2" : "bg-dark-200"
                  )}
                >
                  <div className="bg-dark-00 rounded-lg py-4">
                    <span className="text-dark-700 px-5 text-xs font-semibold lg:px-6 lg:text-sm">
                      {popUpLabel}
                    </span>
                    <div className="mt-3 flex flex-col">
                      {type === SelectionType.Network ? (
                        <NetworkOptions />
                      ) : (
                        <TokenOptions options={options} />
                      )}
                    </div>
                  </div>
                </Listbox.Options>
              </Transition>
            )}
          </div>
        )}
      </Listbox>
    </div>
  );
}

function NetworkOptions() {
  return <div />;
}

function TokenOptions({ options }: { options: any[] | undefined }) {
  return (
    <div>
      {options?.map((option) => (
        <Listbox.Option
          key={option.tokenA.name}
          className="relative cursor-pointer select-none"
          value={option}
        >
          {({ selected, active }) => (
            <>
              <Divider />
              <div
                className={clsx(
                  "my-1 px-5 py-3 lg:my-2 lg:px-6 lg:py-4",
                  active && "bg-dark-gradient-1"
                )}
              >
                <div className="flex flex-row items-center justify-between">
                  <div className="flex w-4/12 flex-row items-center">
                    <Image
                      width={100}
                      height={100}
                      className="h-6 w-6 lg:h-[28px] lg:w-[28px]"
                      data-testid={option.tokenA.name}
                      src={option.tokenA.icon}
                      alt={option.tokenA.name}
                    />
                    <span className="text-dark-1000 ml-2 truncate text-base lg:text-lg">
                      {option.tokenA.name}
                    </span>
                  </div>
                  <div className="flex w-2/12 flex-row items-center justify-center">
                    <FiArrowRight size={15} className="text-dark-500 h-4 w-4" />
                  </div>
                  <div className="flex w-4/12 flex-row items-center">
                    <Image
                      width={100}
                      height={100}
                      className="h-6 w-6 lg:h-[28px] lg:w-[28px]"
                      data-testid={option.tokenB.name}
                      src={option.tokenB.icon}
                      alt={option.tokenB.name}
                    />
                    <span className="text-dark-900 ml-2 truncate text-base lg:text-lg">
                      {option.tokenB.name}
                    </span>
                  </div>
                  <div className="flex w-2/12 flex-row items-center justify-end">
                    {selected && (
                      <FaCheckCircle className="h-6 w-6 text-[#00AD1D]" />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </Listbox.Option>
      ))}
    </div>
  );
}

function Divider() {
  return <div className="mx-5 border-t-[0.5px] border-[#42424280] lg:mx-6" />;
}
