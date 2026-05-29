import React from "react";

const textClassName =
  "font-urbanist font-light text-[24px] lg:text-[45px] leading-[130%] text-center m-0";

export const DigitalEconomySection = () => {
  const textContent =
    "Patent infringement is routine in the digital economy, but enforcement stays out of reach for most - locked behind high costs, opaque underwriting, and funders chasing only multi-million dollar cases.";

  return (
    <section className="relative flex items-center justify-center overflow-hidden py-32">
      <div className="relative mx-auto w-full max-w-[1440px] px-5 lg:px-[75px]">
        <div className="relative">
          {/* Greyed out base text */}
          <p className={`${textClassName} text-white/20`}>{textContent}</p>

          {/* White text with ellipse mask for the glowing center effect */}
          <p
            className={`${textClassName} pointer-events-none absolute inset-0 text-white`}
            style={{
              WebkitMaskImage: "radial-gradient(55% 60% at 50% 50%, black 75%, transparent 100%)",
              maskImage: "radial-gradient(55% 60% at 50% 50%, black 75%, transparent 100%)",
            }}
          >
            {textContent}
          </p>
        </div>
      </div>
    </section>
  );
};
