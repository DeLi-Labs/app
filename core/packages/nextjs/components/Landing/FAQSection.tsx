"use client";

import { Accordion } from "~~/components/ui/Accordion";

const faqData = [
  {
    question: 'What exactly does "programmable intellectual property" mean?',
    answer:
      "Programmable intellectual property can have different meanings depending on the system. In our case, it means that a patent is represented as a specific NFT, from which licensing rights are derived in the form of ERC20 tokens. These license tokens are deployed into automated market makers, where they can be accessed and acquired by anyone in a permissionless way. Each token represents a clearly defined license with specific usage rights. Once acquired, the license can be used in the real world to legally utilize the underlying intellectual property. At the same time, license tokens can be freely traded on secondary markets, enabling liquidity and price discovery for IP.",
  },
  {
    question: "How is DeLi Labs connected to artificial intelligence?",
    answer:
      "DeLi is designed with AI-native use cases in mind. Users can integrate their own AI systems and run them across multiple interactions within the protocol. AI agents can autonomously discover assets, purchase licenses, and access data through token-gated mechanisms. This enables machine-to-machine licensing, where AI systems can directly interact with decentralized markets for data and intellectual property.",
  },
  {
    question: "Does it replace traditional patent law?",
    answer:
      "No. DeLi does not replace patent law, it builds on top of it. The system provides a more efficient infrastructure for licensing and enforcement, but legal ownership and enforceability still rely on existing legal frameworks. If disputes arise, they are resolved in the real world under applicable law.",
  },
  {
    question: "What blockchains does DeLi Labs support?",
    answer:
      "DeLi is designed to be modular and chain-agnostic, but currently focuses on Ethereum and the broader EVM ecosystem. This allows integration with tools like Uniswap V4, smart contracts, and existing DeFi infrastructure, while keeping the option open to expand to other chains.",
  },
  {
    question: "Can the license be changed after registration?",
    answer:
      "We distinguish between immutable and mutable data within the NFT. Core ownership and identity-related information remains immutable to ensure integrity and legal clarity. At the same time, certain metadata fields can be updated to reflect changing market conditions or the status of the patent. Licensing itself is implemented through ERC20 tokens derived from the NFT, each with its own clearly defined terms. Once such a token is issued, its conditions cannot be changed. However, the patent owner can influence future availability by controlling liquidity, for example by stopping the supply of new tokens to the pool.",
  },
  {
    question: "Does the system support collective ownership (Fractional IP)?",
    answer:
      "Yes. DeLi supports fractional ownership through tokenization, allowing multiple parties to hold and monetize intellectual property together. Revenue distribution can be automated, and governance mechanisms can be used to coordinate decisions among stakeholders.",
  },
];

export const FAQSection = () => {
  return (
    <section className="w-full relative py-20 z-10 bg-transparent">
      <div className="w-full max-w-[1290px] mx-auto px-5 lg:px-0">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-20 gap-10 lg:gap-0">
          <h2
            className="text-[45px] font-light leading-[130%] text-white w-full lg:w-[537px]"
            style={{ fontFamily: "Urbanist" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-[16px] leading-[130%] text-white w-full lg:w-[423px]" style={{ fontFamily: "Urbanist" }}>
            Everything you wanted to ask about patent tokenization, legal protection, and trading mechanics, but
            didn&apos;t know where to start. Short, clear, and to the point.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-end gap-16 lg:gap-[409px]">
          <div className="w-full lg:w-[625px]">
            <Accordion items={faqData} />
          </div>

          <button className="bg-white text-[#070A0D] rounded-[10px] px-[50px] py-[10px] font-medium text-[16px] leading-[120%] tracking-[-0.02em] hover:bg-gray-200 transition-colors flex-shrink-0 mb-2">
            Subscribe to the newsletter
          </button>
        </div>
      </div>
    </section>
  );
};
