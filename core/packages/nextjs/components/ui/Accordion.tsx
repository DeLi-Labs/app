"use client";

import { useState } from "react";

export interface AccordionItem {
  question: string;
  answer: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  initialOpenIndex?: number;
}

export const Accordion = ({ items, initialOpenIndex = 0 }: AccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number>(initialOpenIndex);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="flex flex-col gap-[25px] w-full">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="flex flex-col group">
            <div
              className="flex items-center gap-[15px] cursor-pointer"
              onClick={() => toggleOpen(index)}
            >
              <div
                className={`w-[32px] h-[32px] rounded-full border border-white flex-shrink-0 flex items-center justify-center relative transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                <div className="w-[12px] h-[1px] bg-white absolute"></div>
                <div className="w-[1px] h-[12px] bg-white absolute"></div>
              </div>
              <h3 className="text-[21px] text-white leading-[130%] font-urbanist flex-1 m-0">
                {item.question}
              </h3>
            </div>
            <div
              className={`grid transition-all duration-300 ease-in-out ml-[47px] ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pt-[15px]">
                  <p className="text-[16px] text-[#9FA1A1] leading-[130%] pb-2 font-urbanist m-0">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
