"use client";

import { Accordion } from "~~/components/ui/Accordion";

const faqData = [
  {
    question: 'What exactly is a "case-DAO"?',
    answer:
      "A case-DAO is a dedicated on-chain entity that DeLi spins up for every accepted patent infringement case. Each case-DAO has its own treasury holding funder commitments to that specific case, its own legal wrapper around the on-chain entity, and its own set of funders. Funders hold tokenized shares in the case-DAO, and when the case resolves profitably those shares pay out alongside their position. There is no cross-case exposure inside a single vehicle and no shared pool spreading risk across cases at completely different stages.",
  },
  {
    question: "How is DeLi Labs connected to artificial intelligence?",
    answer:
      "DeLi uses a patent-case-tuned AI to build a unified dashboard for each case—combining owner-provided material with public patent and court data into a structured underwriting summary. It does not replace a funder's own due diligence; it shortens the path to yes or no.",
  },
  {
    question: "Does it replace traditional patent law?",
    answer:
      "No. DeLi does not replace patent law or the courts. The platform sits on top of existing legal frameworks: cases proceed through the Unified Patent Court (UPC) under applicable patent law, and every case-DAO is wrapped in a real legal entity (SPV, segregated portfolio cell, foundation, or hybrid). DeLi standardizes funding and operations; the legal outcome is still adjudicated by the court.",
  },
  {
    question: "What blockchains does DeLi Labs support?",
    answer:
      "DeLi is designed to be modular and chain-agnostic, but currently focuses on Ethereum and the broader EVM ecosystem. This allows case-DAO treasuries, funder shares, and settlement rails to use battle-tested smart contract infrastructure while keeping the option open to expand to other chains.",
  },
  {
    question: "Can a funder exit before a case resolves?",
    answer:
      "Yes. Every case lifecycle includes designated funder exit checkpoints — for example, after the due diligence stage but before a complaint is filed at UPC, or after an unfavorable preliminary ruling. At those points a funder can crystallize their position and stop the bleed at known checkpoints rather than be locked in for the full multi-year duration of the case. The exact exit pricing and how exiting positions are reabsorbed or resold is part of the platform's lifecycle design.",
  },
  {
    question: "Does the system support collective funding by retail investors?",
    answer:
      "Yes. The architecture is built around group litigation funding — a mechanism that lets ordinary investors participate collectively in funding a case rather than restricting litigation finance to a small number of professional funds. The exact eligibility, jurisdictional scope, and instrument structure (retail crowdfunding, pooled professional money, or a hybrid) follow the regulatory regime that applies to each case-DAO.",
  },
];

export const FAQSection = () => {
  return (
    <section className="w-full relative py-20 z-10 bg-transparent">
      <div className="mx-auto w-full max-w-[1440px] px-5 lg:px-[75px]">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-20 gap-10 lg:gap-0">
          <h2
            className="text-[45px] font-light leading-[130%] text-white w-full lg:w-[537px]"
            style={{ fontFamily: "Urbanist" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-[16px] leading-[130%] text-white w-full lg:w-[423px]" style={{ fontFamily: "Urbanist" }}>
            Everything you wanted to ask about collective patent enforcement funding, per-case DAOs, and how
            funder shares work — but didn&apos;t know where to start. Short, clear, and to the point.
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
