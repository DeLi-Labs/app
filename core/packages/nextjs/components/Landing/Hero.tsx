"use client";

import Image from "next/image";
import { LandingState } from "../LandingPage";
import { HeroPopularTokens } from "./HeroPopularTokens";
import { StatsSection } from "./StatsSection";
import { LaunchAppButton, ViewOnGitHubButton } from "~~/components/ui/Buttons";

const HERO_BG_SRC = "/assets/bg-2.png";
const HERO_BG_WIDTH = 2880;
const HERO_BG_HEIGHT = 918;

export const Hero = ({ landingState }: { landingState: LandingState }) => {
  return (
    <section className="relative bg-deli-main overflow-x-hidden">
      <div className="flex flex-col gap-20 pt-24 pb-24 lg:pt-32">
        <div className="relative mx-auto w-full max-w-[1440px]">
          <div className="relative grid w-full min-h-[320px] lg:min-h-[420px]">
            <Image
              src={HERO_BG_SRC}
              alt=""
              width={HERO_BG_WIDTH}
              height={HERO_BG_HEIGHT}
              className="col-span-full row-span-full h-full min-h-[320px] w-full object-cover object-center lg:min-h-[420px] pointer-events-none select-none"
              priority
            />
            <div className="col-span-full row-span-full z-10 flex h-full min-h-0 w-full items-center px-5 pt-16 pb-8 lg:px-[75px] lg:pt-20 lg:pb-12">
              <div className="flex w-full flex-col gap-[50px] lg:flex-row lg:items-stretch lg:justify-between lg:gap-[70px]">
                <div className="flex min-w-0 max-w-4xl flex-1 flex-col">
                  <h1 className="text-deli-white m-0">
                    <span className="text-h2 lg:hidden">
                      Turn patent litigation <br />
                      into <span className="text-deli-accent">liquid capital</span>
                    </span>
                    <span className="text-h1 hidden lg:block">
                      <span className="whitespace-nowrap">Turn patent litigation</span> <br />
                      into <span className="text-deli-accent">liquid capital</span>
                    </span>
                  </h1>
                  <p className="text-deli-white m-0 mt-5 max-w-2xl lg:mt-6 lg:mb-10">
                    <span className="text-body-2 lg:hidden">
                      Collective funding for patent enforcement. DeLi orchestrates per-case DAOs that finance
                      infringement actions, with tokenized shares for funders and milestone-gated capital for
                      patent owners.
                    </span>
                    <span className="text-h6 hidden lg:block">
                      Collective funding for patent enforcement. DeLi orchestrates per-case DAOs that finance
                      infringement actions, with tokenized shares for funders and milestone-gated capital for
                      patent owners.
                    </span>
                  </p>
                  <div className="mt-10 flex w-full max-w-2xl flex-col gap-5 lg:mt-0 lg:flex-row lg:items-center lg:gap-4">
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
