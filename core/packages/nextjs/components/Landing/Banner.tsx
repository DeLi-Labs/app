"use client";

import { FC } from "react";

export const Banner: FC = () => {
  return (
    <section className="relative w-[100vw] flex justify-center bg-transparent mt-20 sm:mt-32 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="relative w-full min-h-[419px] overflow-hidden">
        {/* deli labs background text */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-[125px] w-full max-w-[1383px] h-[321px] px-4"
          style={{
            background: "linear-gradient(180deg, #04305C 0%, rgba(14, 46, 82, 0) 100%)",
            WebkitMaskImage: "url('/assets/deli%20labs.png')",
            maskImage: "url('/assets/deli%20labs.png')",
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center bottom",
            maskPosition: "center bottom",
          }}
        />

        {/* The horizontal divider line */}
        <div className="absolute w-full h-[0px] left-0 bottom-[96px] border-t-[2px] border-[#0F1314]" />

        {/* Footer content container constrained to 1440px */}
        <div className="absolute inset-0 w-full max-w-[1440px] mx-auto pointer-events-none z-10">
          {/* Right text labels */}
          <div className="absolute right-4 lg:right-[44px] bottom-[27px] flex flex-col gap-[5px] text-right pointer-events-auto w-fit">
            <span className="font-urbanist font-light text-[12px] lg:text-[16px] leading-[140%] text-white">
              Designed by Tihon Belenkiy
            </span>
            <span className="font-urbanist font-light text-[12px] lg:text-[16px] leading-[140%] text-white">
              @2026 DeLi labs. All rights reserved
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
