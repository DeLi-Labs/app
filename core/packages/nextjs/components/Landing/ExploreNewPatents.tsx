"use client";

import React from "react";
import { formatDollar } from "~~/utils/formatting";
import { LandingState } from "../LandingPage";
import { CATEGORY_STYLES } from "./CategoriesSection";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { PatentCard } from "~~/components/ui/PatentCard";

const PatentCardSkeleton = () => (
  <div className="relative w-[380px] h-[292px] bg-[#070A0D] rounded-[20px] overflow-hidden shrink-0 animate-pulse border border-white/5">
    <div className="relative z-20 p-[20px] h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="w-[120px] h-[34px] bg-white/5 rounded-[10px]" />
        <div className="w-[140px] h-[45px] bg-white/5 rounded-[10px]" />
      </div>
      <div className="flex justify-between items-end gap-[10px]">
        <div className="flex flex-col gap-[10px] flex-1">
          <div className="w-full h-7 bg-white/5 rounded" />
          <div className="w-3/4 h-5 bg-white/5 rounded" />
          <div className="w-1/2 h-5 bg-white/5 rounded" />
        </div>
        <div className="flex flex-col justify-between items-end h-full min-h-[122px] min-w-[65px]">
          <div className="flex flex-col items-end gap-[2px]">
            <div className="w-[40px] h-5 bg-white/5 rounded" />
            <div className="w-[60px] h-5 bg-white/5 rounded" />
          </div>
          <div className="w-[29px] h-[29px] rounded-full bg-white/5" />
        </div>
      </div>
    </div>
  </div>
);

export const ExploreNewPatents = ({ landingState }: { landingState: LandingState }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = React.useState(0);

  const patents = landingState.data?.latestIps || [];

  const patentsData = patents.map(ip => {
    const category = ip.category || "Creative";
    const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES["Creative"];

    const growth = Number(ip.growthPercent) || 0;
    const sign = growth >= 0 ? "+" : "";

    return {
      tokenId: ip.campaigns[0].licenseAddress.toString(),
      numbers: ip.tokenId.toString(),
      category: category,
      categoryIcon: `/assets/${styles.icon}.svg`,
      categoryGradient: styles.strokeGradient,
      title: ip.name,
      description: ip.description,
      change: `${sign}${growth.toFixed(1)}%`,
      price: formatDollar(ip.totalEmittedLicensesValueUSD),
    };
  });

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const firstCard = container.children[0] as HTMLElement;
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = parseInt(window.getComputedStyle(container).gap) || 10;
      const step = cardWidth + gap;

      const currentScroll = container.scrollLeft;
      const currentIndex = Math.round(currentScroll / step);
      const targetIndex = direction === "left" ? Math.max(0, currentIndex - 1) : currentIndex + 1;

      const targetScroll = targetIndex * step;
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
    }
  };

  const onScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const firstCard = container.children[0] as HTMLElement;
      if (!firstCard) return;

      const cardWidth = firstCard.offsetWidth;
      const gap = parseInt(window.getComputedStyle(container).gap) || 10;
      const step = cardWidth + gap;

      const currentScroll = container.scrollLeft;
      const index = Math.round(currentScroll / step);

      setActiveDot(Math.max(0, Math.min(index, patentsData.length - 1)));
    }
  };

  return (
    <section className="py-[120px] flex flex-col gap-[55px] relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto w-full px-5 lg:px-[75px]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-[400px]">
            <h2 className="text-h2 text-deli-white mb-0">Explore new cases</h2>
          </div>
          <div className="max-w-[413px]">
            <p className="text-body-2 text-deli-white m-0 opacity-80">
              Be the first to spot new opportunities. This section contains the most recently opened patent cases
              that are now available for collective funding.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-5 lg:px-[75px]">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-[10px] overflow-x-auto no-scrollbar scroll-smooth pb-4 snap-x snap-mandatory"
        >
          {landingState.isLoading ? (
            <>
              <div className="snap-start shrink-0">
                <PatentCardSkeleton />
              </div>
              <div className="snap-start shrink-0">
                <PatentCardSkeleton />
              </div>
            </>
          ) : (
            patentsData.map((patent, index) => (
              <div key={index} className="snap-start shrink-0">
                <PatentCard {...patent} />
              </div>
            ))
          )}
          <div className="shrink-0 w-[calc(100%-380px-10px)]" />
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-5 lg:px-[75px] mt-4">
        <div className="flex justify-between items-center w-full mx-auto">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full border border-[#555555] flex items-center justify-center hover:border-deli-white transition-colors group cursor-pointer"
          >
            <ChevronLeftIcon className="w-4 h-4 text-[#555555] group-hover:text-deli-white" />
          </button>

          <div className="flex items-center gap-[8px]">
            {(landingState.isLoading ? [0, 1] : patentsData).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  activeDot === i ? "bg-white" : "bg-[#555555]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full border border-deli-white flex items-center justify-center hover:bg-white/10 transition-colors group cursor-pointer"
          >
            <ChevronRightIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};
