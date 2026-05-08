"use client";

import { Category, LandingState } from "../LandingPage";
import { formatDollar } from "~~/utils/formatting";
import { CategoryCard } from "~~/components/ui/CategoryCard";

export const CATEGORY_STYLES: Record<string, { icon: string; strokeGradient: string; glowColor: string }> = {
  Medicine: {
    icon: "medicine",
    strokeGradient: "var(--deli-cat-stroke-medicine)",
    glowColor: "rgba(69, 162, 255, 0.6)",
  },
  Energy: {
    icon: "energy",
    strokeGradient: "var(--deli-cat-stroke-energy)",
    glowColor: "rgba(69, 255, 106, 0.6)",
  },
  Engineering: {
    icon: "engineering",
    strokeGradient: "var(--deli-cat-stroke-engineering)",
    glowColor: "rgba(69, 193, 255, 0.6)",
  },
  Creative: {
    icon: "creative",
    strokeGradient: "var(--deli-cat-stroke-creative)",
    glowColor: "rgba(255, 137, 69, 0.6)",
  },
  Technology: {
    icon: "technology",
    strokeGradient: "linear-gradient(180deg, #45FFFF 0%, #016D4C 100%)",
    glowColor: "rgba(69, 255, 255, 0.4)",
  },
  Resources: {
    icon: "resources",
    strokeGradient: "linear-gradient(180deg, #F9FF45 0%, #064B01 100%)",
    glowColor: "rgba(249, 255, 69, 0.4)",
  },
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "Medicine",
    ipCount: null,
    totalEmittedLicensesValueUSD: "",
    totalTradingVolumeUSD: "",
    topGrowth24hCampaignLicenseAddress: null,
    totalInteractions: null,
    totalSales: null,
    retailPercent: "",
    growthPercent: "",
    topGrowth24hCampaign: null,
  },
  {
    id: "Energy",
    ipCount: null,
    totalEmittedLicensesValueUSD: "",
    totalTradingVolumeUSD: "",
    topGrowth24hCampaignLicenseAddress: null,
    totalInteractions: null,
    totalSales: null,
    retailPercent: "",
    growthPercent: "",
    topGrowth24hCampaign: null,
  },
  {
    id: "Engineering",
    ipCount: null,
    totalEmittedLicensesValueUSD: "",
    totalTradingVolumeUSD: "",
    topGrowth24hCampaignLicenseAddress: null,
    totalInteractions: null,
    totalSales: null,
    retailPercent: "",
    growthPercent: "",
    topGrowth24hCampaign: null,
  },
  {
    id: "Creative",
    ipCount: null,
    totalEmittedLicensesValueUSD: "",
    totalTradingVolumeUSD: "",
    topGrowth24hCampaignLicenseAddress: null,
    totalInteractions: null,
    totalSales: null,
    retailPercent: "",
    growthPercent: "",
    topGrowth24hCampaign: null,
  },
  {
    id: "Technology",
    ipCount: null,
    totalEmittedLicensesValueUSD: "",
    totalTradingVolumeUSD: "",
    topGrowth24hCampaignLicenseAddress: null,
    totalInteractions: null,
    totalSales: null,
    retailPercent: "",
    growthPercent: "",
    topGrowth24hCampaign: null,
  },
  {
    id: "Resources",
    ipCount: null,
    totalEmittedLicensesValueUSD: "",
    totalTradingVolumeUSD: "",
    topGrowth24hCampaignLicenseAddress: null,
    totalInteractions: null,
    totalSales: null,
    retailPercent: "",
    growthPercent: "",
    topGrowth24hCampaign: null,
  },
];

export const CategoriesSection = ({ landingState }: { landingState: LandingState }) => {
  const { data, isLoading, error } = landingState;
  const isError = !!error;

  return (
    <section className="py-20">
      <div className="mb-14 max-w-[1290px] mx-auto px-5 lg:px-0 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <h2 className="text-h2 text-deli-white leading-none m-0">Explore all categories</h2>
        <p className="text-h6 text-deli-grey-light max-w-xl m-0">
          From biotechnology to AI, explore patents grouped by key technology areas. Find the niche that will change
          tomorrow&apos;s world.
        </p>
      </div>
      <div className="max-w-[1290px] mx-auto w-full px-5 lg:px-0 relative overflow-hidden">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] pb-10 pt-8 items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-6 xl:gap-10 pr-6 xl:pr-10 shrink-0 items-center">
              {DEFAULT_CATEGORIES.map((defaultCategory) => {
                const categoryData = data?.categories?.find(c => c.id === defaultCategory.id);
                const styles = CATEGORY_STYLES[defaultCategory.id] || CATEGORY_STYLES["Creative"];
                
                const growthStr = categoryData?.growthPercent;
                const change = Number(growthStr) || 0;
                const changeSign = change >= 0 ? "+" : "";
                
                const displayGrowth = growthStr ? `${changeSign}${growthStr}%` : "--";
                const displayPatents = categoryData?.ipCount ?? "--";
                const displayMarketCap = categoryData?.totalEmittedLicensesValueUSD 
                  ? formatDollar(Number(categoryData.totalEmittedLicensesValueUSD)) 
                  : "--";
                const displayTopToken = categoryData?.topGrowth24hCampaign?.licenseSymbol || "--";

                return (
                  <CategoryCard
                    key={`${i}-${defaultCategory.id}`}
                    name={defaultCategory.id}
                    patents={displayPatents}
                    icon={styles.icon}
                    strokeGradient={styles.strokeGradient}
                    glowColor={styles.glowColor}
                    marketCap={displayMarketCap}
                    change24h={displayGrowth}
                    topToken={displayTopToken}
                    isLoading={isLoading}
                    isError={isError}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
