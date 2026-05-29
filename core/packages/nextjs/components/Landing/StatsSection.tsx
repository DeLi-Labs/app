"use client";

import Image from "next/image";
import { formatDollar, formatNumber } from "~~/utils/formatting";
import { LandingState } from "../LandingPage";
import {
  MARKET_CAP_ICON,
  TOTAL_INTERACTIONS,
  UNIQUE_CREATORS_WALLETS_ICON,
  UNIQUE_IP_NFTS_ICON,
  _24H_TRADING_VOLUME_ICON,
  _ALL_TIME_TRADING_VOLUME_ICON,
} from "~~/components/assets/common";
import { StatCard } from "~~/components/ui/StatCard";

const Bloom = ({ className, size = 252 }: { className: string; size?: number }) => (
  <div
    className={`pointer-events-none absolute z-0 -translate-x-1/2 -translate-y-1/2 mix-blend-screen ${className}`}
    style={{ width: size, height: size }}
  >
    <Image src="/assets/bloom.svg" alt="" fill className="object-contain" />
  </div>
);

/** Glow at grid gutters: desktop = 2 column junctions (3 cols), mobile = 1 center junction (2 cols). */
const BackgroundLights = () => (
  <div className="pointer-events-none absolute inset-0 z-0">
    {/* Mobile: column gutter between 2 cols, at each row junction (3 rows) */}
    <Bloom className="left-[calc(50%-2.5px)] top-[calc(33.333%-2.5px)] block lg:hidden" size={200} />
    <Bloom className="left-[calc(50%-2.5px)] top-[calc(66.666%-2.5px)] block lg:hidden" size={200} />

    {/* Desktop: between columns at vertical center of 3×2 grid */}
    <Bloom className="left-[calc(33.333%-2.5px)] top-1/2 hidden lg:block" />
    <Bloom className="left-[calc(66.666%-2.5px)] top-1/2 hidden lg:block" />
  </div>
);

type StatsSectionProps = {
  landingState?: LandingState;
  /** Tighter spacing for explore hero (text → metrics → table). */
  compact?: boolean;
};

export const StatsSection = ({ landingState, compact = false }: StatsSectionProps) => {
  const { data, isLoading, error } = landingState || {};
  const statsData = data?.stats;

  const isError = !!error;

  const stats = [
    { title: "CASES MARKET CAP", value: formatDollar(statsData?.totalEmittedLicensesValueUSD), icon: MARKET_CAP_ICON },
    {
      title: "24H TRADING VOLUME",
      value: formatDollar(statsData?.totalTradingVolume24hUSD),
      icon: _24H_TRADING_VOLUME_ICON,
    },
    { title: "UNIQUE IP CASES", value: formatNumber(statsData?.uniquePatents), icon: UNIQUE_IP_NFTS_ICON },
    {
      title: "UNIQUE IP OWNERS",
      value: formatNumber(statsData?.uniquePatentOwners),
      icon: UNIQUE_CREATORS_WALLETS_ICON,
    },
    {
      title: "ALL-TIME TRADING VOLUME",
      value: formatDollar(statsData?.totalTradingVolumeUSD),
      icon: _ALL_TIME_TRADING_VOLUME_ICON,
    },
    { title: "TOTAL DAO MEMBERS", value: formatNumber(statsData?.totalInteractions), icon: TOTAL_INTERACTIONS },
  ];

  return (
    <section
      className={`relative flex justify-center overflow-hidden bg-transparent pt-0 ${compact ? "pb-8 lg:pb-10" : "pb-24"}`}
    >
      <div
        className={`relative mx-auto w-full max-w-[1440px] px-5 lg:px-[75px] ${compact ? "pt-2 lg:pt-3" : "pt-[25px]"}`}
      >
        <div className="relative z-10 grid grid-cols-2 items-stretch gap-[5px] lg:grid-cols-3">
          <BackgroundLights />
          {stats.map((stat, idx) => (
            <div key={idx} className="relative z-10 flex w-full">
              <StatCard {...stat} isLoading={isLoading} isError={isError} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
