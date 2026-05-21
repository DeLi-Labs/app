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

const BackgroundLights = () => (
  <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-start pt-[25px]">
    <div className="relative w-full h-[195px] flex items-center">
      {/* Bloom 1 (Left Junction) */}
      <div className="absolute left-[33.333%] -translate-x-1/2 w-[252px] h-[252px] mix-blend-screen opacity-100">
        <Image src="/assets/bloom.svg" alt="bloom light" fill className="object-contain" />
      </div>

      {/* Bloom 2 (Right Junction) */}
      <div className="absolute left-[66.666%] -translate-x-1/2 w-[252px] h-[252px] mix-blend-screen opacity-100">
        <Image src="/assets/bloom.svg" alt="bloom light" fill className="object-contain" />
      </div>
    </div>
  </div>
);

export const StatsSection = ({ landingState }: { landingState?: LandingState }) => {
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
    { title: "TOTAL INTERACTIONS", value: formatNumber(statsData?.totalInteractions), icon: TOTAL_INTERACTIONS },
  ];

  return (
    <section className="relative pt-0 pb-24 overflow-hidden flex justify-center bg-transparent">
      <div className="relative mx-auto w-full max-w-[1440px] px-5 pt-[25px] lg:px-[75px]">
        {/* Physical light sources rendered directly behind the 3x2 grid */}
        <div className="hidden lg:block">
          <BackgroundLights />
        </div>

        {/* 5px gap exactly between cards */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-[5px] items-center justify-items-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="relative w-full flex justify-center items-center">
              <StatCard {...stat} isLoading={isLoading} isError={isError} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
