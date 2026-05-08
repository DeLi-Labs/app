import type { ReactNode } from "react";
import Image from "next/image";

export interface StatCardProps {
  title: string;
  value: string;
  /** Image URL, or inline icon (e.g. SVG from `common.tsx`). */
  icon: string | ReactNode;
  isLoading?: boolean;
  isError?: boolean;
}

export const StatCard = ({ title, value, icon, isLoading, isError }: StatCardProps) => (
  <div className="relative overflow-hidden rounded-[10px] border border-transparent w-full max-w-[425px] h-[95px] [background:linear-gradient(color-mix(in_srgb,var(--deli-main)_80%,transparent),color-mix(in_srgb,var(--deli-main)_80%,transparent))_padding-box,var(--deli-stroke-grey)_border-box]">
    {/* Content */}
    <div className="relative z-30 w-full h-full flex items-center gap-[10px] px-[25px]">
      <div className="relative shrink-0 w-[40px] h-[40px] flex items-center justify-center">
        {typeof icon === "string" ? (
          <Image src={icon} alt="" width={40} height={40} className="opacity-100" />
        ) : (
          <span className="flex size-[40px] shrink-0 items-center justify-center [&_svg]:size-[40px]" aria-hidden>
            {icon}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-left items-start">
        <span className="text-h5 font-normal text-deli-white leading-none">{title}</span>
        {isLoading ? (
          <span className="h-[20px] w-24 bg-white/20 animate-pulse rounded mt-1"></span>
        ) : isError ? (
          <span className="text-body-1-caps font-light text-red-400 leading-tight">Could not find data</span>
        ) : (
          <span className="text-body-1-caps font-light text-deli-grey-light leading-tight">{value}</span>
        )}
      </div>
    </div>
  </div>
);
