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
  <div className="deli-stat-card relative h-full min-h-[124px] w-full max-w-[425px] overflow-hidden rounded-[10px] lg:h-[95px] lg:min-h-0">
    <div className="relative z-10 flex h-full w-full flex-col items-start gap-[10px] px-[15px] py-[13px] lg:flex-row lg:items-center lg:gap-[10px] lg:px-[25px] lg:py-0">
      <div className="relative flex h-[40px] w-[40px] shrink-0 items-center justify-center">
        {typeof icon === "string" ? (
          <Image src={icon} alt="" width={40} height={40} className="opacity-100" />
        ) : (
          <span className="flex size-[40px] shrink-0 items-center justify-center [&_svg]:size-[40px]" aria-hidden>
            {icon}
          </span>
        )}
      </div>

      <div className="flex min-w-0 w-full flex-col items-start gap-[2px] text-left lg:gap-0.5">
        <span className="line-clamp-2 min-h-[2.6em] w-full text-body-2-caps leading-[1.3] text-deli-white lg:line-clamp-none lg:min-h-0 lg:text-h5 lg:leading-none">
          {title}
        </span>
        {isLoading ? (
          <span className="mt-1 h-[20px] w-24 animate-pulse rounded bg-white/20"></span>
        ) : isError ? (
          <span className="w-full truncate text-body-3-caps leading-tight text-red-400 lg:text-body-1-caps">
            Could not find data
          </span>
        ) : (
          <span className="w-full truncate text-body-3-caps leading-tight text-deli-grey-light lg:text-body-1-caps">
            {value}
          </span>
        )}
      </div>
    </div>
  </div>
);
