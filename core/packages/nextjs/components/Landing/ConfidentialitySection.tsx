import React from "react";

type GlowLayer = {
  width: number;
  height: number;
  top: number;
  left: number;
};

const GLOW_GRADIENT = "linear-gradient(135.75deg, #010E6D 21.8%, rgba(1, 14, 109, 0.5) 94.06%)";

const glowLayerStyle = (glow: GlowLayer): React.CSSProperties => ({
  width: glow.width,
  height: glow.height,
  top: glow.top,
  left: glow.left,
  background: GLOW_GRADIENT,
  borderRadius: "50%",
  filter: "blur(70px)",
});

const CONFIDENTIALITY_CARDS: {
  title: string;
  description: string;
  glows: GlowLayer[];
}[] = [
  {
    title: "Patent owners",
    description:
      "Your case substance - claim charts, evidence, and damages models - stays completely private. Only cryptographic hashes are anchored on the ledger to ensure integrity without exposing data.",
    glows: [
      { width: 186, height: 186, top: 53, left: -84 },
      { width: 291, height: 291, top: -44, left: 236 },
    ],
  },
  {
    title: "Funders",
    description:
      "Security and privacy go hand-in-hand. KYC verification is handled seamlessly off-chain, ensuring you remain pseudonymous on-chain by default.",
    glows: [
      { width: 195, height: 195, top: -32, left: -65.33 },
      { width: 291, height: 291, top: -44, left: 235.67 },
    ],
  },
  {
    title: "Infringers and licensees",
    description:
      'Engaging with our platform will never create a public "suspected infringer" record. Settlements are executed as confidential transfers, where only the fact that a transaction occurred is visible.',
    glows: [
      { width: 291, height: 291, top: 114, left: -194.67 },
      { width: 291, height: 291, top: -128, left: 235.33 },
    ],
  },
];

const CardGlow = ({ glows }: { glows: GlowLayer[] }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
    {glows.map((glow, index) => (
      <div key={index} className="absolute" style={glowLayerStyle(glow)} />
    ))}
  </div>
);

export const ConfidentialitySection = () => {
  return (
    <section className="relative w-full flex flex-col items-center overflow-hidden py-24">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[55px] px-5 lg:px-[75px]">
        <h2 className="text-h2 m-0 text-left text-deli-white">Confidentiality is the default, not a feature</h2>

        <div className="flex w-full flex-col gap-6 lg:flex-row lg:gap-8">
          {CONFIDENTIALITY_CARDS.map(({ title, description, glows }) => (
            <div
              key={title}
              className="relative flex min-w-0 flex-1 flex-col gap-4 overflow-hidden rounded-xl border border-[var(--deli-black-bg)] pt-[120px] pr-[32px] pb-[27px] pl-[23px]"
            >
              <CardGlow glows={glows} />
              <h3 className="relative z-10 text-h4 m-0 text-deli-white">{title}</h3>
              <p className="relative z-10 text-body-2 m-0 text-deli-white">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
