import { useRouter } from "next/router";
import { useState } from "react";
import { IconType } from "react-icons";
import { FiBook, FiHelpCircle, FiShield } from "react-icons/fi";
import BottomModal from "./commons/BottomModal";
import ProofOfAssetsCard from "./ProofOfAssetsCard";

interface MenuListItem {
  id: string;
  title: string;
  icon: IconType;
  onClick: () => void;
}

export default function MobileBottomMenu() {
  const router = useRouter();
  const [openProofOfAssets, setOpenProofOfAssets] = useState<boolean>(false);

  const menuList: MenuListItem[] = [
    {
      id: "assets",
      title: "Proof of Assets",
      icon: FiShield,
      onClick: () => setOpenProofOfAssets(true),
    },
    {
      id: "faqs",
      title: "FAQs",
      icon: FiHelpCircle,
      onClick: () => router.push("/faq"),
    },
    {
      id: "guide",
      title: "User Guide",
      icon: FiBook,
      onClick: () => router.push("/user-guide"),
    },
  ];

  return (
    <>
      <ul className="flex justify-between">
        {menuList.map(({ icon: Icon, ...item }) => (
          <li
            key={item.title}
            aria-hidden="true"
            className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-70"
            onClick={item.onClick}
          >
            <Icon size={28} className="text-dark-900" />
            <span className="text-xs font-semibold text-dark-900">
              {item.title}
            </span>
          </li>
        ))}
      </ul>
      <BottomModal
        title="Proof of assets"
        isOpen={openProofOfAssets}
        onClose={() => setOpenProofOfAssets(false)}
      >
        <div className="mt-1">
          <ProofOfAssetsCard />
        </div>
      </BottomModal>
    </>
  );
}
