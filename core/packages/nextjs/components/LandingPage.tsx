"use client";

import { useEffect, useState } from "react";
import { AboutUs } from "./Landing/AboutUs";
import { Banner } from "./Landing/Banner";
import { ConfidentialitySection } from "./Landing/ConfidentialitySection";
import { CategoriesSection } from "./Landing/CategoriesSection";
import { DigitalEconomySection } from "./Landing/DigitalEconomySection";
import { ExploreNewPatents } from "./Landing/ExploreNewPatents";
import { FAQSection } from "./Landing/FAQSection";
import { PickYourEntryPoint } from "./Landing/PickYourEntryPoint";
import { Hero } from "./Landing/Hero";
import { SubscribeSection } from "./Landing/SubscribeSection";
import { TheInfrastructureLayer } from "./Landing/TheInfrastructureLayer";
import { WhyDeliLabs } from "./Landing/WhyDeliLabs";
import { OwnerIPWithCampaigns } from "~~/types";

const sectionAnchorClass = "scroll-mt-32";

export type MainStats = {
  id: string;
  uniquePatents: number;
  totalEmittedLicensesValueUSD: string;
  totalTradingVolumeUSD: string;
  totalTradingVolume24hUSD: number;
  uniquePatentOwners: number;
  totalInteractions: number;
  totalSales: number;
  campaignAmount: number;
  retailPercent: string;
  growthPercent: string;
};

export type Category = {
  id: string;
  totalEmittedLicensesValueUSD: string;
  totalTradingVolumeUSD: string;
  topGrowth24hCampaignLicenseAddress: string | null;
  topGrowth24hCampaign?: {
    licenseAddress: string;
    licenseSymbol: string;
    numeraireAddress: string;
    numeraireSymbol: string;
    poolId: string;
    licenseType: string;
    denominationUnit: string;
    denominationAmount: number;
    licenseDuration: string;
    territoryRestriction: string[];
    usageRightsDefinition: string;
    transferrabilityFlag: string;
    currentPrice: number;
    totalSupply: string;
    totalEmittedLicensesValueUSD: string;
    totalTradingVolumeUSD: string;
  } | null;
  totalInteractions: number | null;
  totalSales: number | null;
  retailPercent: string;
  growthPercent: string;
  ipCount: number | null;
};

export type LandingPageData = {
  stats: MainStats | null;
  categories: Category[];
  latestIps: OwnerIPWithCampaigns[];
};

export type LandingState = {
  data: LandingPageData | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
};

export const LandingPage = () => {
  const [landingState, setLandingState] = useState<LandingState>({
    data: null,
    isLoading: true,
    error: null,
    isSuccess: false,
  });

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLandingState(prev => ({ ...prev, isLoading: true, error: null, isSuccess: false }));

        const response = await fetch("/api/ip/landing", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch landing data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
        setLandingState({ data, isLoading: false, error: null, isSuccess: true });
      } catch (err: any) {
        console.error("Error fetching landing data:", err);
        setLandingState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || "An unknown error occurred",
          isSuccess: false,
        }));
      }
    };

    fetchLandingData();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <div className="min-h-screen bg-deli-main text-deli-white selection:bg-accent selection:text-deli-main overflow-x-hidden">
      <div id="hero" className={sectionAnchorClass}>
        <Hero landingState={landingState} />
      </div>

      <div className="w-full relative z-10">
        <DigitalEconomySection />
      </div>

      <div id="ip-category" className={`w-full relative z-10 ${sectionAnchorClass}`}>
        <CategoriesSection landingState={landingState} />
      </div>

      <div className="w-full relative z-10">
        <WhyDeliLabs />
      </div>

      <div className="w-full relative z-10">
        <ExploreNewPatents landingState={landingState} />
      </div>

      <div id="about-us" className={`w-full relative z-10 ${sectionAnchorClass}`}>
        <AboutUs />
      </div>

      <div className="w-full relative z-10">
        <PickYourEntryPoint />
      </div>

      <div className="w-full relative z-10 overflow-hidden">
        <TheInfrastructureLayer />
      </div>

      <div className="w-full relative z-10">
        <ConfidentialitySection />
      </div>

      <div id="subscribe" className={sectionAnchorClass}>
        <SubscribeSection />
      </div>

      <div id="faq" className={sectionAnchorClass}>
        <FAQSection />
      </div>

      <div className="w-full relative z-10">
        <Banner />
      </div>
    </div>
  );
};
