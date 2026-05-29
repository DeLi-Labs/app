import React from "react";
import { BackgroundEdgeBlend } from "./BackgroundEdgeBlend";

export const AboutUs = () => {
  return (
    <section className="relative w-full py-24 flex flex-col items-center overflow-hidden bg-deli-main">
      <div className="mx-auto w-full max-w-[1440px] px-5 lg:px-[75px] flex flex-col gap-[55px] mb-20">
        <h2 className="text-h2 text-deli-white text-left m-0">About Us</h2>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-24">
          <p className="text-h6 text-deli-white flex-1 max-w-[557px] m-0">
            Enforcing a patent takes capital most small and mid-size owners cannot access. Traditional funders
            only back cases with multi-million dollar payouts.
          </p>
          <p className="text-h6 text-deli-white flex-1 max-w-[637px] m-0">
            DeLi connects patent owners, funders, and infringers on one platform. Each case is its own on-chain
            entity with a dedicated treasury and milestone-gated funding. Funders hold tokenized shares and can
            exit at predefined checkpoints.
          </p>
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative mx-auto flex h-[525px] w-full max-w-[1440px] items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-[809px] -top-[142px]">
          <video
            src="/assets/about.mov"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        </div>

        <BackgroundEdgeBlend />

        {/* Centered Goal Text */}
        <div className="relative z-10 max-w-[403px] text-center px-5">
          <p className="text-h6 text-deli-white m-0">
            Make patent enforcement workable for underserved cases - and open litigation funding to anyone who want to back them.
          </p>
        </div>
      </div>
    </section>
  );
};
