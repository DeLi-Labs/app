"use client";

import Image from "next/image";
import { LandingState } from "../LandingPage";
import { HeroPopularTokens } from "./HeroPopularTokens";
import { StatsSection } from "./StatsSection";
import { BackgroundEdgeBlend } from "./BackgroundEdgeBlend";
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
            <div className="relative col-span-full row-span-full min-h-[320px] lg:min-h-[420px]">
              <Image
                src={HERO_BG_SRC}
                alt=""
                width={HERO_BG_WIDTH}
                height={HERO_BG_HEIGHT}
                className="h-full min-h-[320px] w-full object-cover object-center lg:min-h-[420px] pointer-events-none select-none"
                priority
              />
              <BackgroundEdgeBlend />
            </div>
            <div className="col-span-full row-span-full z-10 flex h-full min-h-0 w-full min-w-0 items-center px-5 pt-16 pb-8 lg:px-[75px] lg:pt-20 lg:pb-12">
              <div className="flex w-full min-w-0 flex-col items-stretch gap-[50px] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,510px)] lg:items-stretch lg:gap-[70px]">
                <div className="flex min-w-0 max-w-4xl flex-col text-center lg:max-w-none lg:text-left">
                  <h1 className="text-deli-white m-0 min-w-0">
                    <span className="text-h2 lg:hidden">
                      Turn patent litigation <br />
                      into <span className="text-deli-accent">liquid capital</span>
                    </span>
                    <span className="text-h1 hidden lg:block">
                      <span className="2xl:whitespace-nowrap">Turn patent litigation</span> <br />
                      into <span className="text-deli-accent">liquid capital</span>
                    </span>
                  </h1>
                  <p className="text-deli-white m-0 mx-auto mt-5 max-w-2xl lg:mx-0 lg:mt-6 lg:mb-10">
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
                  <div className="mx-auto mt-10 flex w-full max-w-2xl flex-col gap-5 lg:mx-0 lg:mt-0 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-3">
                    <div className="flex w-full shrink-0 lg:min-w-[180px] lg:flex-1 lg:basis-[180px] [&>a]:flex [&>a]:w-full">
                      <LaunchAppButton className="min-h-14 w-full shrink-0" />
                    </div>
                    <ViewOnGitHubButton
                      href="https://github.com/DeLi-Labs"
                      className="!flex min-h-14 w-full shrink-0 items-center justify-center lg:min-w-[180px] lg:flex-1 lg:basis-[180px]"
                    />
                  </div>
                </div>
                <div className="box-border w-full max-w-none lg:min-w-[320px] lg:max-w-[510px] lg:justify-self-end">
                  <HeroPopularTokens className="w-full" />
                </div>
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
