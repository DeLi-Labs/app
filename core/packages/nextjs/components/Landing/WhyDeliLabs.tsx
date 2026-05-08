import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

const traditionalItems = [
  "Static PDF files",
  "Manual audit trail",
  "Delayed royalty payments",
  "High legal friction",
  "Court-dependent enforcement",
  "Isolated paper assets",
];

const deliWayItems = [
  "Living programmable code",
  "Real-time verification",
  "Instant automated splits",
  "Seamless API integration",
  "Enforced by design",
  "Liquid on-chain primitives",
];

/** Matches PatentHeader / StatCard: solid fill + var(--deli-stroke-grey) rim */
const cardShell =
  "border border-transparent [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]";

const listIconShell =
  "border border-transparent [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box]";

export const WhyDeliLabs = () => {
  return (
    <section className="relative py-24 px-5 overflow-hidden flex flex-col justify-center items-center bg-transparent">
      <div className="relative w-full max-w-[1290px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
          <h2 className="font-urbanist font-light text-[35px] lg:text-[50px] leading-[110%] text-deli-white m-0">
            Why DeLi labs?
          </h2>
          <p className="font-urbanist font-light text-[16px] lg:text-[18px] leading-[150%] text-deli-white max-w-[500px] m-0">
            Forget about months of paperwork and hidden fees. We compared the traditional approach to licensing with
            DeLi&apos;s transparent model. Spoiler alert: the future lies in speed and blockchain.
          </p>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[474px_474px_312px] gap-[14.5px] justify-center">
          {/* Card 1: Traditional Licensing */}
          <div className={`relative rounded-[20px] overflow-hidden p-10 flex flex-col gap-8 h-[455px] ${cardShell}`}>
            {/* Exact Figma Gradient for Traditional Licensing part */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "145px",
                height: "234px",
                right: "-47px",
                top: "-92px",
                background: "linear-gradient(180deg, #F8F8F8 0%, #000000 100%)",
                filter: "blur(57px)",
                borderRadius: "50%",
              }}
            />

            <h3 className="font-urbanist text-[25px] leading-[1.4em] text-deli-white z-10">Traditional Licensing</h3>
            <div className="flex flex-col gap-7 z-10">
              {traditionalItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-5">
                  <div
                    className={`relative flex-shrink-0 w-[30px] h-[30px] rounded-[6px] flex items-center justify-center text-white/30 overflow-hidden ${listIconShell}`}
                  >
                    <XMarkIcon className="relative z-10 w-[10px] h-[10px]" />
                  </div>
                  <span className="font-urbanist text-[21px] leading-[1.3em] text-[#555555]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: The DeLi Way */}
          <div className={`relative rounded-[20px] overflow-hidden p-10 flex flex-col gap-8 h-[455px] ${cardShell}`}>
            {/* 5-Layer Figma Gradient System for the top-right corner */}
            {/* Layer 1: "Star" base glow */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "344.61px",
                height: "348.7px",
                right: "-144.19px",
                top: "-149px",
                background: "rgba(6, 68, 130, 0.33)",
                filter: "blur(27.0632px)",
                borderRadius: "13.5316px",
              }}
            />
            {/* Layer 2: "Star" highlight plus-lighter */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "261.34px",
                height: "264.44px",
                right: "-103.83px",
                top: "-106.87px",
                background: "rgba(6, 68, 130, 0.45)",
                mixBlendMode: "plus-lighter",
                filter: "blur(27.0632px)",
                borderRadius: "13.5316px",
              }}
            />
            {/* Layer 3: "Ellipse" outer soft glow */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "163.98px",
                height: "165.92px",
                right: "-55.15px",
                top: "-56.32px",
                background: "rgba(95, 165, 247, 0.47)",
                filter: "blur(47.3606px)",
                borderRadius: "50%",
              }}
            />
            {/* Layer 4: "Ellipse" core blue glow */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "131.95px",
                height: "133.52px",
                right: "-39.14px",
                top: "-40.11px",
                background: "#5FA5F7",
                filter: "blur(23.6803px)",
                borderRadius: "50%",
              }}
            />
            {/* Layer 5: "Ellipse" center white plus-lighter */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "79.43px",
                height: "80.37px",
                right: "-13.52px",
                top: "-12.89px",
                background: "rgba(255, 255, 255, 0.7)",
                mixBlendMode: "plus-lighter",
                filter: "blur(38.105px)",
                borderRadius: "50%",
              }}
            />

            {/* Bottom-right Decorations: 3 Ellipses and 2 Stars */}
            <div className="absolute bottom-0 right-0 w-full h-1/2 pointer-events-none z-0 overflow-hidden opacity-40">
              {/* Ellipse 1 (Blue) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "15%",
                  right: "10%",
                  width: "120px",
                  height: "120px",
                  background: "#5FA5F7",
                  filter: "blur(50px)",
                  borderRadius: "50%",
                  opacity: 0.15,
                }}
              />
              {/* Ellipse 2 (Blue) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "10%",
                  right: "25%",
                  width: "80px",
                  height: "80px",
                  background: "#5FA5F7",
                  filter: "blur(40px)",
                  borderRadius: "50%",
                  opacity: 0.1,
                }}
              />
              {/* Ellipse 3 (White) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "25%",
                  right: "20%",
                  width: "60px",
                  height: "60px",
                  background: "#FFFFFF",
                  filter: "blur(30px)",
                  borderRadius: "50%",
                  opacity: 0.05,
                }}
              />

              {/* Star 1 */}
              <div style={{ position: "absolute", bottom: "20%", right: "15%", width: "4px", height: "4px" }}>
                <div className="absolute inset-0 bg-white blur-[1px]" />
                <div className="absolute top-1/2 left-[-2px] w-[8px] h-[0.5px] bg-white opacity-60" />
                <div className="absolute top-[-2px] left-1/2 w-[0.5px] h-[8px] bg-white opacity-60" />
              </div>
              {/* Star 2 */}
              <div style={{ position: "absolute", bottom: "12%", right: "18%", width: "3px", height: "3px" }}>
                <div className="absolute inset-0 bg-white blur-[1px]" />
                <div className="absolute top-1/2 left-[-1.5px] w-[6px] h-[0.5px] bg-white opacity-50" />
                <div className="absolute top-[-1.5px] left-1/2 w-[0.5px] h-[6px] bg-white opacity-50" />
              </div>
            </div>

            <h3 className="font-urbanist text-[25px] leading-[1.4em] text-deli-white z-10">The DeLi Way</h3>
            <div className="flex flex-col gap-7 z-10">
              {deliWayItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-5">
                  <div
                    className={`relative flex-shrink-0 w-[30px] h-[30px] rounded-[6px] flex items-center justify-center text-deli-white overflow-hidden ${listIconShell}`}
                  >
                    <CheckIcon className="relative z-10 w-3 h-[9px]" />
                  </div>
                  <span className="font-urbanist text-[21px] leading-[1.3em] text-deli-white">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Banner / Turn your ideas */}
          <div className={`relative rounded-[20px] overflow-hidden group w-full lg:w-[312px] h-[455px] ${cardShell}`}>
            {/* Ellipse (White) */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "240px",
                height: "257px",
                left: "calc(50% - 120px)",
                top: "70px",
                background: "#FFFFFF",
                filter: "blur(77px)",
                opacity: 0.1, // Added small opacity as it's a soft glow
                borderRadius: "50%",
              }}
            />

            {/* Ellipse (Blue 1) */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "88.75px",
                height: "270.24px",
                left: "calc(50% - 92.5px)",
                top: "65px",
                background: "#5FA5F7",
                filter: "blur(42px)",
                transform: "matrix(0.78, 0.62, 0.62, -0.78, 0, 0)",
                borderRadius: "50%",
              }}
            />

            {/* Ellipse (Blue Overlay) */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "88.75px",
                height: "270.24px",
                left: "calc(50% - 82.5px)",
                top: "64.55px",
                background: "#5FA5F7",
                mixBlendMode: "overlay",
                filter: "blur(42px)",
                transform: "rotate(36.58deg)",
                borderRadius: "50%",
              }}
            />

            {/* Ellipse (Blue Faint) */}
            <div
              className="absolute pointer-events-none z-0"
              style={{
                width: "88.75px",
                height: "270.24px",
                left: "calc(50% - 162.5px)",
                top: "10px",
                background: "rgba(95, 165, 247, 0.3)",
                filter: "blur(42px)",
                transform: "matrix(-0.78, -0.62, -0.62, 0.78, 0, 0)",
                borderRadius: "50%",
              }}
            />

            {/* Rocket Image */}
            <div
              className="absolute z-10"
              style={{ width: "270px", height: "270px", left: "calc(50% - 135px)", top: "48px" }}
            >
              <Image src="/assets/banner-bg.svg" alt="Rocket background" fill className="object-contain" />
            </div>

            {/* Bottom Dark Fade Rectangle */}
            <div
              className="absolute z-[15] pointer-events-none"
              style={{
                width: "100%",
                height: "319px",
                left: "0px",
                bottom: "0px",
                background: "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 61.98%)",
              }}
            />

            {/* Bottom shine glow (from CSS "grad") */}
            <div
              className="absolute z-[16] pointer-events-none"
              style={{
                width: "calc(100% + 40px)",
                height: "455px",
                left: "-20px",
                top: "0px",
                background: "rgba(0, 0, 0, 0.01)",
                boxShadow:
                  "inset 0px -18.19px 18.19px -10px rgba(255, 255, 255, 0.4), inset 0px -26.38px 27.28px -17.28px #6694FF, inset 0px -22.77px 54.57px #04305C",
              }}
            />

            {/* launch-btn container — matches Header Launch App link */}
            <div className="absolute z-20 flex items-center p-0" style={{ right: "16px", top: "16px" }}>
              <Link href="/registration" className="flex items-center gap-[14px] p-0 transition-all group">
                <span className="text-body-2 text-white group-hover:text-deli-accent font-normal leading-[130%] transition-colors">
                  Launch App
                </span>
                <div className="w-8 h-8 rounded-full border border-white group-hover:border-deli-accent flex items-center justify-center bg-transparent shrink-0 transition-all">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <ChevronRightIcon className="absolute h-[10px] w-auto text-white stroke-[2.5px] group-hover:opacity-0 transition-opacity" />
                    <ArrowRightIcon className="absolute h-[10px] w-auto text-deli-accent stroke-[2.5px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            </div>

            {/* text container */}
            <div
              className="absolute z-20 flex flex-col items-start p-0 gap-[10px]"
              style={{
                width: "calc(100% - 40px)",
                height: "178px",
                left: "20px",
                top: "256px",
              }}
            >
              <h3 className="font-urbanist font-normal text-[35px] leading-[120%] text-white m-0 self-stretch">
                Turn your ideas
                <br />
                into liquid capital.
              </h3>
              <p className="font-urbanist font-normal text-[16px] leading-[130%] text-[#9FA1A1] m-0 self-stretch">
                The first Web 3.0 platform for tokenization and instant monetization of patents. Enable an influx of
                investment in your technology through IP-Fi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
