import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { ArrowUpRightIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

export interface PatentCardProps {
  tokenId: string;
  numbers: string;
  category: string;
  categoryIcon: string;
  categoryGradient: string;
  title: string;
  description: string;
  change: string;
  price: string;
}

const shortenAddress = (address: string) => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const PatentCard = ({
  tokenId,
  numbers,
  category,
  categoryIcon,
  categoryGradient,
  title,
  description,
  change,
  price,
}: PatentCardProps) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (tokenId) {
      navigator.clipboard.writeText(tokenId);
      toast.success("Address copied!");
    }
  };

  return (
    <Link
      href={`/patent/${numbers}`}
      className="relative block w-[380px] h-[292px] bg-[#070A0D] rounded-[20px] overflow-hidden group shrink-0 transition-transform duration-300 hover:scale-[1.02]"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <Image src="/assets/category-bg.svg" alt="texture" fill className="object-cover" />
      </div>

      {/* Decorative Ellipses (Grey Blur) */}
      <div
        className="absolute w-[81.3px] h-[112.34px] left-[308px] top-[67px] bg-[#555555] opacity-30 pointer-events-none"
        style={{ filter: "blur(107px)" }}
      />
      <div
        className="absolute w-[66.28px] h-[79.74px] left-[-3px] top-[1px] bg-[#555555] opacity-30 pointer-events-none"
        style={{ filter: "blur(42px)" }}
      />

      {/* Category Gradient Glow */}
      <div
        className="absolute w-[145px] h-[145px] left-[-49px] top-[-44px] pointer-events-none transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: categoryGradient,
          filter: "blur(47px)",
          mixBlendMode: "screen",
          opacity: 0.8,
        }}
      />

      {/* Bottom Light-to-Dark Gradient Shadow */}
      <div className="absolute inset-x-0 bottom-0 h-[113px] bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

      {/* Card Content */}
      <div className="relative z-20 p-[20px] h-full flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex justify-between items-start">
          {/* Token ID Tag */}
          <div className="flex items-center gap-[7px] bg-[#0F1314] rounded-[10px] px-[10px] py-[7px] border border-white/5 relative z-30">
            <div className="flex items-center gap-[4px]">
              <span className="text-body-3 text-deli-white whitespace-nowrap">Token ID</span>
              <span className="text-body-3 text-[#555555]">{shortenAddress(tokenId)}</span>
            </div>
            <DocumentDuplicateIcon
              onClick={handleCopy}
              className="w-[15px] h-[15px] text-[#555555] hover:text-deli-white cursor-pointer transition-colors"
            />
          </div>

          {/* Category Tag */}
          <div className="flex items-center gap-[7px] bg-[#0F1314] rounded-[10px] px-[21px] py-[7px] border border-white/5 h-[45px]">
            <div className="relative w-[31px] h-[31px]">
              <Image src={categoryIcon} alt={category} fill className="object-contain" />
            </div>
            <span className="text-body-2 text-deli-white">{category}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex justify-between items-end gap-[10px]">
          {/* Left Content */}
          <div className="flex flex-col gap-[10px] flex-1">
            <h4 className="text-h4 text-deli-white line-clamp-2 leading-[1.2]">{title}</h4>
            <p className="text-body-3 text-deli-grey-light line-clamp-3 overflow-hidden">{description}</p>
          </div>

          {/* Right Content */}
          <div className="flex flex-col justify-between items-end h-full min-h-[122px] min-w-[65px]">
            <div className="flex flex-col items-end gap-[2px]">
              <span
                className={`text-body-2 font-medium text-right ${change.startsWith("-") ? "text-red-400" : "text-[#2BD700]"}`}
              >
                {change}
              </span>
              <span className="text-body-2 text-deli-white font-medium">{price}</span>
            </div>
            <div className="w-[29px] h-[29px] border border-[#555555] rounded-full flex items-center justify-center group-hover:border-deli-white transition-colors">
              <ArrowUpRightIcon className="w-[15px] h-[15px] text-deli-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
