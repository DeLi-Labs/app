import React from "react";

export const DigitalEconomySection = () => {
  const textContent =
    "The digital economy moves at the speed of light—running on data, code, AI models, and forked repositories. Yet, licensing remains stuck in the era of paper: slow, opaque, centralized, and disconnected from execution.";

  return (
    <section className="relative px-5 py-32 flex justify-center items-center overflow-hidden">
      <div className="relative w-full max-w-[1290px]">
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
