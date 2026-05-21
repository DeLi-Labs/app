"use client";

import { FC } from "react";

export const Banner: FC = () => {
  return (
    <section className="relative w-[100vw] flex justify-center bg-transparent mt-20 sm:mt-32 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="relative w-full min-h-[419px] overflow-hidden">
        {/* deli labs background text */}
        <div
          className="absolute inset-x-0 bottom-[125px] h-[321px] w-full"
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

        {/* Footer aligned with page content grid */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[27px] z-10 mx-auto w-full max-w-[1440px] px-5 lg:px-[75px]">
          <div className="pointer-events-auto flex w-full flex-col items-end gap-[5px] text-right">
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
