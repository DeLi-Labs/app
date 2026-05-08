import React from "react";

export const AboutUs = () => {
  return (
    <section className="relative w-full py-24 flex flex-col items-center overflow-hidden bg-deli-main">
      <div className="w-full max-w-[1290px] px-5 flex flex-col gap-[55px] mb-20">
        <h2 className="text-h2 text-deli-white text-left m-0">About Us</h2>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-24">
          <p className="text-h6 text-deli-white flex-1 max-w-[557px] m-0">
            The digital economy runs on data, code, models, content, and inventions. Yet licensing remains slow, opaque,
            centralized, and fundamentally disconnected from how digital systems are built and used. Artificial
            intelligence is trained on vast amounts of data and creative output.
          </p>
          <p className="text-h6 text-deli-white flex-1 max-w-[637px] m-0">
            Open-source software is composed, forked, and embedded across global supply chains. IoT systems, digital
            twins, and autonomous agents continuously generate and consume protected knowledge. But today, intellectual
            property is still licensed through static contracts, fragmented intermediaries, and after-the-fact
            enforcement. DeLi exists to change this.
          </p>
        </div>
      </div>

      {/* Banner Section */}
      <div className="relative w-full max-w-[1290px] mx-auto h-[525px] flex items-center justify-center overflow-hidden rounded-[20px]">
        {/* Background Video/Image Container */}
        <div className="absolute inset-0 w-full h-[809px] -top-[142px]">
          <video
            src="/assets/about.mov"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          {/* Subtle overlay to blend with the page theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-deli-main via-transparent to-deli-main opacity-80" />
        </div>

        {/* Centered Goal Text */}
        <div className="relative z-10 max-w-[403px] text-center px-5">
          <p className="text-h6 text-deli-white m-0">
            Our goal is to turn intellectual property into programmable, liquid, and enforceable on-chain primitives.
          </p>
        </div>
      </div>
    </section>
  );
};
