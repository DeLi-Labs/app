import React from "react";

export const DigitalEconomySection = () => {
  const textContent =
    "Patent infringement is routine in the digital economy, but enforcement stays out of reach for most - locked behind high costs, opaque underwriting, and funders chasing only multi-million dollar cases.";

  return (
    <section className="relative py-32 flex justify-center items-center overflow-hidden">
      <div className="relative mx-auto w-full max-w-[1440px]">
        {/* Greyed out base text */}
        <p className="font-urbanist font-light text-[24px] lg:text-[45px] leading-[130%] text-center text-white/20 m-0">
          {textContent}
        </p>

        {/* White text with ellipse mask for the glowing center effect */}
        <p
          className="font-urbanist font-light text-[24px] lg:text-[45px] leading-[130%] text-center text-white absolute inset-0 m-0 pointer-events-none"
          style={{
            WebkitMaskImage: "radial-gradient(55% 60% at 50% 50%, black 75%, transparent 100%)",
            maskImage: "radial-gradient(55% 60% at 50% 50%, black 75%, transparent 100%)",
          }}
        >
          {textContent}
        </p>
      </div>
    </section>
  );
};
