import Image from "next/image";
import Link from "next/link";
import ConnectButton from "./ConnectButton";

export default function Header(): JSX.Element {
  return (
    <div className="relative z-[1] flex items-center justify-between bg-inherit px-5 pt-8 pb-6 md:px-12 md:py-6 lg:px-[120px] lg:pt-10 lg:pb-12">
      <Link href="/">
        <div className="relative h-[32px] w-[140px] cursor-pointer lg:h-[60px] lg:w-[264px]">
          <Image
            fill
            data-testid="header-bridge-logo"
            src="/header-logo.svg"
            alt="Bridge Logo"
          />
        </div>
      </Link>
      <div className="flex h-9 items-center md:h-10 lg:h-12">
        <ConnectButton />
      </div>
    </div>
  );
}
