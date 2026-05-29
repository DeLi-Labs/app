import React from "react";
import Image from "next/image";
import { CATEGORY_STYLES } from "~~/components/Landing/CategoriesSection";
import { isAttachmentProxyImageSrc } from "~~/utils/storageMediaUrl";

export interface TokenData {
  no: number;
  name: string;
  icon: string;
  category: string;
  topCampaignPrice: string;
  marketCap: string;
  totalTradingVolume: string;
  totalInteractions: string;
  growthPercent: string;
  growthValue: number;
}

interface TokenTableProps {
  tokens: TokenData[];
  onRowClick?: (token: TokenData) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
}

const SortingIcons = ({ active, order }: { active?: boolean; order?: "asc" | "desc" }) => (
  <div className="flex flex-row items-center gap-[3px] opacity-80 group-hover:opacity-100 transition-opacity">
    <div
      className={`w-[7px] h-[9px] relative flex items-center justify-center ${active && order === "asc" ? "opacity-100 scale-110" : "opacity-40"}`}
    >
      <svg width="7" height="9" viewBox="0 0 7 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.5 0L7 4H0L3.5 0Z" fill={active && order === "asc" ? "#A7D2FF" : "white"} />
      </svg>
    </div>
    <div
      className={`w-[7px] h-[9px] relative flex items-center justify-center ${active && order === "desc" ? "opacity-100 scale-110" : "opacity-40"}`}
    >
      <svg width="7" height="9" viewBox="0 0 7 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.5 9L0 5H7L3.5 9Z" fill={active && order === "desc" ? "#A7D2FF" : "white"} />
      </svg>
    </div>
  </div>
);

const HEADER_MAP: Record<string, string> = {
  "№": "tokenId",
  Patent: "name",
  "Funding Target": "totalEmittedLicensesValueUSD",
  "Top Campaign Price": "topCampaign_currentPrice",
  "Trading Volume": "totalTradingVolumeUSD",
  Interactions: "totalInteractions",
  Growth: "growthPercent",
};

export const TokenTable = ({ tokens, onRowClick, sortBy, sortOrder, onSort }: TokenTableProps) => {
  return (
    <div className="flex flex-col gap-[10px] w-full max-w-[1210px] mx-auto">
      {/* Desktop Table View */}
      <div className="hidden lg:block w-full overflow-x-auto xl:overflow-x-hidden">
        <div className="min-w-[1050px] w-full overflow-hidden rounded-xl border border-white/[0.05] bg-[#0F1314]">
          {/* Table Headers */}
          <div className="w-full h-[46px] flex flex-row items-center px-[20px] box-border border-b border-white/[0.05]">
          {/* Left */}
          <div className="w-[60px] h-[18px] flex flex-row items-center shrink-0">
            <div
              className="flex flex-row items-center cursor-pointer group hover:bg-white/[0.04] p-1 rounded transition-colors"
              onClick={() => onSort?.("tokenId")}
            >
              <span className="font-urbanist font-medium text-[12px] leading-[120%] tracking-[-0.02em] text-white mr-2">
                №
              </span>
              <SortingIcons active={sortBy === "tokenId"} order={sortOrder} />
            </div>
          </div>

          <div className="w-[180px] h-[18px] flex flex-row items-center shrink-0 ml-[40px]">
            <div
              className="flex flex-row justify-center items-center gap-[8px] h-[18px] cursor-pointer group hover:bg-white/[0.04] p-1 rounded transition-colors"
              onClick={() => onSort?.("name")}
            >
              <span className="font-urbanist font-normal text-[14px] leading-[130%] text-white">Patent</span>
              <SortingIcons active={sortBy === "name"} order={sortOrder} />
            </div>
          </div>

          {/* Right - Header Columns */}
          <div className="flex-1 h-[46px] flex flex-row items-center">
            {["Top Campaign Price", "Funding Target", "Growth", "Trading Volume", "Interactions"].map((label, i) => {
              const field = HEADER_MAP[label];
              const isSortable = !!field;

              return (
                <div
                  key={i}
                  className={`flex-1 h-[46px] rounded-[4px] flex flex-col justify-center items-center p-[14px_12px] gap-[10px] box-border group transition-colors ${isSortable ? "cursor-pointer hover:bg-white/[0.04]" : "cursor-default"}`}
                  onClick={() => isSortable && onSort?.(field)}
                >
                  <div className="flex flex-row justify-center items-center gap-[12px] h-[18px]">
                    <span className="font-urbanist font-normal text-[14px] leading-[130%] uppercase text-white whitespace-nowrap">
                      {label}
                    </span>
                    {isSortable && <SortingIcons active={sortBy === field} order={sortOrder} />}
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col divide-y divide-white/[0.05]">
            {tokens.map(token => (
              <div
                key={token.no}
                className="w-full h-[60px] flex flex-row items-center px-[20px] box-border hover:bg-white/[0.04] transition-colors cursor-pointer"
                onClick={() => onRowClick?.(token)}
              >
                {/* Left Group (No & Icon/Name) */}
                <div className="w-[60px] h-[32px] flex flex-row items-center justify-start shrink-0">
                  <span className="font-urbanist font-normal text-[16px] leading-[130%] uppercase text-white">
                    {token.no}
                  </span>
                </div>

                <div className="w-[180px] h-[32px] flex flex-row justify-start items-center gap-[15px] shrink-0 ml-[40px]">
                  <div className="w-[32px] h-[32px] bg-white/10 rounded-full shrink-0 relative overflow-hidden">
                    <Image
                      src={token.icon}
                      alt={token.name}
                      fill
                      className="object-cover"
                      unoptimized={isAttachmentProxyImageSrc(token.icon)}
                    />
                  </div>
                  <span
                    className="font-urbanist font-normal text-[16px] leading-[130%] text-white flex-1 truncate"
                    title={token.name}
                  >
                    {token.name}
                  </span>
                </div>

                {/* Right Group (Stats) */}
                <div className="flex-1 h-[60px] flex flex-row items-center">
                  <div className="flex-1 h-[46px] rounded-[4px] flex flex-col justify-center items-center p-[14px_12px] box-border">
                    <span className="font-urbanist font-normal text-[14px] leading-[130%] uppercase text-white">
                      {token.topCampaignPrice}
                    </span>
                  </div>
                  <div className="flex-1 h-[46px] rounded-[4px] flex flex-col justify-center items-center p-[14px_12px] box-border">
                    <span className="font-urbanist font-normal text-[14px] leading-[130%] uppercase text-white">
                      {token.marketCap}
                    </span>
                  </div>
                  <div className="flex-1 h-[46px] rounded-[4px] flex flex-col justify-center items-center p-[14px_12px] box-border">
                    <span
                      className={`font-urbanist font-normal text-[14px] leading-[130%] uppercase ${token.growthValue >= 0 ? "text-[#32D74B]" : "text-[#FF453A]"}`}
                    >
                      {token.growthValue >= 0 ? "+" : ""}
                      {token.growthPercent}
                    </span>
                  </div>
                  <div className="flex-1 h-[46px] rounded-[4px] flex flex-col justify-center items-center p-[14px_12px] box-border">
                    <span className="font-urbanist font-normal text-[14px] leading-[130%] uppercase text-white">
                      {token.totalTradingVolume}
                    </span>
                  </div>
                  <div className="flex-1 h-[46px] rounded-[4px] flex flex-col justify-center items-center p-[14px_12px] box-border">
                    <span className="font-urbanist font-normal text-[14px] leading-[130%] uppercase text-white">
                      {token.totalInteractions}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden flex flex-col gap-5">
        {tokens.map(token => {
          const categoryKey =
            Object.keys(CATEGORY_STYLES).find(key => key.toLowerCase() === token.category.toLowerCase()) || "Creative";
          const styles = CATEGORY_STYLES[categoryKey];
          const glowColor = styles.glowColor || "rgba(69, 162, 255, 0.6)";

          return (
            <div
              key={token.no}
              className="w-full relative group bg-[#0F1314]/50 border border-white/[0.05] rounded-[24px] p-6 flex flex-col gap-6 overflow-hidden"
              onClick={() => onRowClick?.(token)}
            >
              {/* Category Glow (borrowed from PatentCard style) */}
              <div
                className="absolute w-[145px] h-[145px] -left-[49px] -top-[44px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"
                style={{
                  background: styles.strokeGradient,
                  filter: "blur(47px)",
                  mixBlendMode: "screen",
                }}
              />

              {/* Card Header */}
              <div className="relative z-10 flex flex-row items-center justify-between w-full">
                <div className="flex flex-row items-center gap-4">
                  <div className="w-[48px] h-[48px] bg-white/10 rounded-full shrink-0 relative overflow-hidden">
                    <Image
                      src={token.icon}
                      alt={token.name}
                      fill
                      className="object-cover"
                      unoptimized={isAttachmentProxyImageSrc(token.icon)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-urbanist font-medium text-[18px] leading-[130%] text-white truncate max-w-[150px]">
                      {token.name}
                    </span>
                    <span className="font-urbanist font-normal text-[12px] text-[#9FA1A1]">#{token.no}</span>
                  </div>
                </div>

                {/* Category Badge */}
                <div
                  className="flex flex-row items-center gap-2 rounded-full px-3 py-1.5 border"
                  style={{
                    backgroundColor: glowColor.replace("0.6", "0.15").replace("0.4", "0.15"),
                    borderColor: glowColor.replace("0.6", "0.4").replace("0.4", "0.4"),
                  }}
                >
                  <div className="w-4 h-4 relative">
                    <Image
                      src={`/assets/${styles.icon}.svg`}
                      alt={token.category}
                      fill
                      className="object-contain brightness-200"
                    />
                  </div>
                  <span
                    className="font-urbanist font-medium text-[12px] uppercase"
                    style={{ color: glowColor.replace("0.6", "1").replace("0.4", "1") }}
                  >
                    {token.category}
                  </span>
                </div>
              </div>

              {/* Card Body (Metrics) */}
              <div className="relative z-10 flex flex-col gap-4 border-t border-white/[0.1] pt-6">
                {[
                  { label: "TOP CAMPAIGN PRICE", value: token.topCampaignPrice },
                  { label: "FUNDING TARGET", value: token.marketCap },
                  { label: "TRADING VOLUME", value: token.totalTradingVolume },
                  { label: "INTERACTIONS", value: token.totalInteractions },
                  {
                    label: "GROWTH",
                    value: token.growthPercent,
                    color: token.growthValue >= 0 ? "text-[#32D74B]" : "text-[#FF453A]",
                  },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-row justify-between items-center">
                    <span className="font-urbanist font-normal text-[14px] leading-[130%] text-[#9FA1A1] uppercase">
                      {stat.label}
                    </span>
                    <span
                      className={`font-urbanist font-medium text-[16px] leading-[130%] uppercase ${stat.color || "text-white"}`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card Footer (Explore Button) */}
              <button className="w-full h-[48px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-[12px] flex items-center justify-center transition-colors">
                <span className="font-urbanist font-medium text-[16px] text-white">Explore</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
