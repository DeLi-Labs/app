"use client";

import Image from "next/image";
import { LandingState } from "../LandingPage";
import { HeroPopularTokens } from "./HeroPopularTokens";
import { StatsSection } from "./StatsSection";
import { LaunchAppButton, ViewOnGitHubButton } from "~~/components/ui/Buttons";

const HERO_BG_SRC = "/1ebc2ecddac10f1215f1374e9fb172e8666b439f.jpg";
const HERO_BG_WIDTH = 3840;
const HERO_BG_HEIGHT = 2160;

export const Hero = ({ landingState }: { landingState: LandingState }) => {
  return (
    <section className="relative bg-deli-main overflow-x-hidden">
      <div className="flex flex-col gap-20 pt-14 pb-24">
        <div className="relative mx-auto w-full max-w-[1290px]">
          <div className="relative grid w-full">
            <Image
              src={HERO_BG_SRC}
              alt=""
              width={HERO_BG_WIDTH}
              height={HERO_BG_HEIGHT}
              className="col-span-full row-span-full w-full h-auto pointer-events-none select-none mix-blend-color-dodge"
              priority
            />
            <div className="col-span-full row-span-full z-10 flex h-full min-h-0 w-full items-center py-12">
              <div className="flex w-full items-stretch justify-between gap-[70px]">
                <div className="flex min-w-0 max-w-4xl flex-1 flex-col items-start justify-start text-left">
                  <h1 className="text-h1 text-deli-white mb-6">
                    <span className="whitespace-nowrap">Turn your ideas into</span> <br />{" "}
                    <span className="text-deli-accent">liquid capital</span>
                  </h1>
                  <p className="text-h6 text-deli-white mb-10 max-w-2xl">
                    Building Liquid IP for AI, data, and digital innovation. DeLi Labs is building decentralized
                    licensing infrastructure for digital assets, data, and intellectual property.
                  </p>
                  <div className="flex w-full max-w-2xl flex-row items-center gap-4">
                    <div className="flex min-h-0 min-w-0 flex-1 [&_a]:flex [&_a]:min-h-14 [&_a]:w-full [&_a]:flex-1 [&_button]:min-h-14 [&_button]:w-full [&_button]:flex-1">
                      <LaunchAppButton className="min-h-14 w-full min-w-0 flex-1" />
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-1">
                      <ViewOnGitHubButton
                        href="https://github.com/DeLi-Labs"
                        className="!flex min-h-14 w-full min-w-0 flex-1 items-center justify-center"
                      />
                    </div>
                  </div>
                </div>
                <HeroPopularTokens />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full relative z-20">
          <StatsSection landingState={landingState} />
        </div>
      </div>
    </section>
  );
};
