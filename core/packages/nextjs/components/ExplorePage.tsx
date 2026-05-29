"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Banner } from "./Landing/Banner";
import { DiscoverAllTokens } from "./Landing/DiscoverAllTokens";
import { StatsSection } from "./Landing/StatsSection";
import type { LandingState } from "./LandingPage";

const EXPLORE_BG_SRC = "/assets/bg-3.png";
const EXPLORE_BG_WIDTH = 2880;
const EXPLORE_BG_HEIGHT = 918;

export const ExplorePage = () => {
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
        setLandingState({ data, isLoading: false, error: null, isSuccess: true });
      } catch (err: unknown) {
        console.error("Error fetching landing data:", err);
        setLandingState(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "An unknown error occurred",
          isSuccess: false,
        }));
      }
    };

    void fetchLandingData();
  }, []);

  return (
    <div className="min-h-screen bg-deli-main text-deli-white selection:bg-accent selection:text-deli-main overflow-x-hidden">
      <section className="relative bg-deli-main overflow-x-hidden">
        <div className="relative mx-auto w-full max-w-[1440px] pt-24 pb-24 lg:pt-32">
          <div className="relative grid w-full">
            <Image
              src={EXPLORE_BG_SRC}
              alt=""
              width={EXPLORE_BG_WIDTH}
              height={EXPLORE_BG_HEIGHT}
              className="col-span-full row-span-full h-full min-h-full w-full object-cover object-top pointer-events-none select-none"
              priority
            />
            <div className="col-span-full row-span-full z-10 flex w-full flex-col gap-3 lg:gap-5">
              <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 pb-1 lg:px-[75px] lg:pt-10 lg:pb-3">
                <div className="flex min-w-0 max-w-4xl flex-col text-center lg:max-w-3xl lg:text-left">
                  <h1 className="m-0 min-w-0 text-deli-white">
                    <span className="text-h2 lg:hidden">Discover all tokens</span>
                    <span className="text-h1 hidden lg:block">Discover all tokens</span>
                  </h1>
                  <p className="m-0 mx-auto mt-4 max-w-2xl text-deli-white lg:mx-0 lg:mt-5">
                    <span className="text-body-2 lg:hidden">
                      A comprehensive registry of tokenized patents with real-time data. Track trading volumes and price
                      dynamics, and select assets based on accurate figures rather than guesswork.
                    </span>
                    <span className="text-h6 hidden lg:block">
                      A comprehensive registry of tokenized patents with real-time data. Track trading volumes and price
                      dynamics, and select assets based on accurate figures rather than guesswork.
                    </span>
                  </p>
                </div>
              </div>
              <StatsSection landingState={landingState} compact />
              <DiscoverAllTokens />
            </div>
          </div>
        </div>
      </section>

      <Banner gradientColor="#2a2a99" />
    </div>
  );
};
