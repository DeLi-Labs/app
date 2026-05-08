import React from "react";

export const TheInfrastructureLayer = () => {
  return (
    <section className="w-full flex justify-center py-20 overflow-hidden relative px-5">
      <div className="relative w-full max-w-[1290px] min-h-[499px] flex flex-col">
        {/* bg - left half */}
        <div
          className="absolute overflow-hidden pointer-events-none rounded-l-[20px]"
          style={{
            width: "50%",
            height: "459px",
            left: "0",
            top: "20px",
            background: "url(/assets/infra-bg.png) no-repeat",
            backgroundSize: "200% 100%", // Stretch horizontally to fill its half
            backgroundPosition: "left center",
            mixBlendMode: "color-dodge",
          }}
        />

        {/* bg - right half (mirrored) */}
        <div
          className="absolute overflow-hidden pointer-events-none rounded-r-[20px]"
          style={{
            width: "50%",
            height: "459px",
            right: "0",
            top: "20px",
            background: "url(/assets/infra-bg.png) no-repeat",
            backgroundSize: "200% 100%", // Stretch horizontally to fill its half
            backgroundPosition: "left center",
            mixBlendMode: "color-dodge",
            transform: "scaleX(-1)",
          }}
        />

        {/* Glow Layers (Background) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Glow Layer 1 - Huge subtle blue */}
          <div
            className="absolute"
            style={{
              width: "444px",
              height: "444px",
              left: "calc(50% + 217px)",
              transform: "translateX(-50%)",
              top: "100px",
              background: "rgba(6, 68, 130, 0.15)",
              filter: "blur(60px)",
              borderRadius: "16.5px",
            }}
          />

          {/* Glow Layer 2 - Base plus lighter blue */}
          <div
            className="absolute"
            style={{
              width: "336.71px",
              height: "336.71px",
              left: "calc(50% + 165px)",
              transform: "translateX(-50%)",
              top: "153.64px",
              background: "rgba(6, 68, 130, 0.18)",
              mixBlendMode: "plus-lighter",
              filter: "blur(60px)",
              borderRadius: "16.5px",
            }}
          />

          {/* Glow Layer 3 - Core wide blue */}
          <div
            className="absolute"
            style={{
              width: "211.27px",
              height: "211.27px",
              left: "calc(50% + 102px)",
              transform: "translateX(-50%)",
              top: "218.01px",
              background: "rgba(95, 165, 247, 0.10)",
              filter: "blur(90px)",
            }}
          />

          {/* Glow Layer 4 - Intense core blue */}
          <div
            className="absolute"
            style={{
              width: "170.01px",
              height: "170.01px",
              left: "calc(50% + 81px)",
              transform: "translateX(-50%)",
              top: "238.65px",
              background: "rgba(95, 165, 247, 0.15)",
              filter: "blur(65px)",
            }}
          />

          {/* Glow Layer 5 - Core shining white */}
          <div
            className="absolute"
            style={{
              width: "102.33px",
              height: "102.33px",
              left: "calc(50% + 48px)",
              transform: "translateX(-50%)",
              top: "273.31px",
              background: "rgba(180, 210, 255, 0.12)",
              mixBlendMode: "plus-lighter",
              filter: "blur(40px)",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Content Section */}
        <div className="relative z-10 flex flex-col gap-12 lg:gap-[67px]">
          {/* Top Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start w-full gap-6">
            <h2
              className="font-urbanist font-light text-white m-0 tracking-tight"
              style={{
                width: "100%",
                maxWidth: "468px",
                fontSize: "45px",
                lineHeight: "130%",
              }}
            >
              The Infrastructure Layer
            </h2>
            <p
              className="font-urbanist font-normal text-white m-0 opacity-80"
              style={{
                width: "100%",
                maxWidth: "475px",
                fontSize: "16px",
                lineHeight: "130%",
              }}
            >
              Behind every patent lies a complex system of legal and software solutions. DeLi&apos;s infrastructure
              represents a new generation of standards for protecting and monetizing ideas on a global scale.
            </p>
          </div>

          {/* Central Cards container */}
          <div className="flex flex-col lg:flex-row gap-[10px] w-full max-w-[1130px] lg:mx-auto lg:translate-x-[-15px]">
            {/* Left Column */}
            <div className="flex flex-col gap-[10px] w-full lg:w-1/2">
              <Card
                title="On-Chain IP Representation"
                description="We transform IP into programmable on-chain primitives. Assets embed ownership rights and execution logic directly into their code."
              />
              <Card
                title="Programmable Licensing"
                description="We replace static contracts with automated smart mechanisms. Royalties flow in real-time based on usage, bypassing intermediaries."
              />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-[10px] w-full lg:w-1/2">
              <Card
                title="Decentralized Governance"
                description="We build frameworks for community-led pricing and access. This ensures the infrastructure remains neutral and controlled by its builders."
              />
              <Card
                title="Cryptographic Provenance"
                description="We provide an immutable ledger for AI and data lineage. This guarantees verifiable attribution across digital supply chains."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Card = ({ title, description }: { title: string; description: string }) => {
  return (
    <div
      className="flex flex-col shrink-0 relative overflow-hidden h-auto lg:h-[181px] w-full"
      style={{
        boxSizing: "border-box",
        padding: "47px 40px",
        gap: "17px",
        background: "rgba(5, 10, 20, 0.85)",
        backdropFilter: "blur(47px)",
        WebkitBackdropFilter: "blur(47px)",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.04)",
      }}
    >
      <h3
        className="font-urbanist font-normal text-white m-0"
        style={{
          width: "100%",
          maxWidth: "480px",
          fontSize: "26px",
          lineHeight: "120%",
        }}
      >
        {title}
      </h3>
      <p
        className="font-urbanist font-normal text-[#9FA1A1] m-0"
        style={{
          width: "100%",
          maxWidth: "480px",
          fontSize: "16px",
          lineHeight: "130%",
        }}
      >
        {description}
      </p>
    </div>
  );
};
