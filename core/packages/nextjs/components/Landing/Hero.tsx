"use client";

import Image from "next/image";
import { StatsSection } from "./StatsSection";
import { LaunchAppButton, ViewOnGitHubButton } from "~~/components/ui/Buttons";
import { LandingState } from "../LandingPage";

export const Hero = ({
  landingState
}: {
  landingState: LandingState;
}) => {
  return (
    <section className="relative flex flex-col items-center justify-center text-center pt-32 pb-20 px-5 overflow-hidden min-h-[90vh] bg-deli-main">
      {/* Background Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 95%)",
        }}
      >
        <Image src="/assets/bg-light.svg" alt="Background Light" fill className="object-cover opacity-50" priority />
      </div>

      {/* Background Masked Images from Figma */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none"
        style={{
          maskImage:
            "radial-gradient(circle at center, black 15%, transparent 55%), linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 95%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 15%, transparent 55%), linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 95%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        {/* Top Texture at y=0 */}
        <div className="absolute top-0 left-0 w-full h-[776px] opacity-[0.48] mix-blend-plus-lighter">
          <Image src="/assets/Rectangle.png" alt="Hero Mask Top" fill className="object-cover" />
        </div>
        {/* Bottom Texture at y=742px - Flipped for seamless transition */}
        <div className="absolute top-[742px] left-0 w-full h-[776px] opacity-[0.48] mix-blend-plus-lighter transform scale-y-[-1]">
          <Image src="/assets/Rectangle.png" alt="Hero Mask Bottom" fill className="object-cover" />
        </div>
      </div>

      <div className="max-w-4xl z-10">
        {/* Header-1: Urbanist 400, 80px, 1.1em line-height */}
        <h1 className="text-h1 text-deli-white mb-6">
          Turn your ideas into <br /> <span className="text-deli-accent">liquid capital</span>
        </h1>
        {/* Header-6: Urbanist 400, 21px, 1.3em line-height */}
        <p className="text-h6 text-deli-white mb-10 max-w-2xl mx-auto">
          Building Liquid IP for AI, data, and digital innovation. DeLi Labs is building decentralized licensing
          infrastructure for digital assets, data, and intellectual property.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <LaunchAppButton />
          <ViewOnGitHubButton href="https://github.com/DeLi-Labs" />
        </div>
      </div>
      <div className="mt-20 relative flex items-center justify-center">
        {/* Background image around the sphere from Figma */}
        <div className="absolute w-[623px] h-[623px] -z-10">
          <Image src="/assets/sphere-bg.svg" alt="Sphere Background" fill className="object-contain opacity-80" />
        </div>
        <Image
          src="/assets/logo-sphere.svg"
          alt="Logo Sphere"
          width={340}
          height={340}
          className="rounded-full shadow-[0_0_100px_rgba(167,209,254,0.3)] relative z-10"
        />
      </div>

      {/* Render the StatsSection inside Hero to inherit the background styling */}
      <div className="mt-12 w-full relative z-20">
        <StatsSection landingState={landingState}/>
      </div>
    </section>
  );
};
