import {
  CREATIVE_ICON,
  ENERGY_ICON,
  ENGINEERING_ICON,
  MEDICINE_ICON,
  RESOURCES_ICON,
  TECHNOLOGY_ICON,
} from "~~/components/assets/common";
import type { PatentCategory } from "~~/utils/patentCategoryColors";
import { getParentCategoryForIndustryLabel } from "~~/utils/industryData";

export type PatentHeaderIndustriesProps = {
  industries: string[];
  isLoading?: boolean;
};

const categoryIcons: Record<PatentCategory, typeof MEDICINE_ICON> = {
  Medicine: MEDICINE_ICON,
  Engineering: ENGINEERING_ICON,
  Energy: ENERGY_ICON,
  Technology: TECHNOLOGY_ICON,
  Resources: RESOURCES_ICON,
  Creative: CREATIVE_ICON,
};

const iconForIndustryLabel = (label: string) => {
  const parent = getParentCategoryForIndustryLabel(label);
  return parent ? categoryIcons[parent] : TECHNOLOGY_ICON;
};

export const PatentHeaderIndustries = ({ industries, isLoading = false }: PatentHeaderIndustriesProps) => {
  const skeletonClassName = "animate-pulse rounded-md bg-deli-background";

  return (
    <div className="relative z-10 flex w-full min-w-0 flex-col gap-4">
      {isLoading ? (
        <div className={`${skeletonClassName} h-6 w-28`} />
      ) : (
        <h6 className="text-h6 text-deli-white">Industries:</h6>
      )}
      <div className="flex w-full min-w-0 flex-wrap gap-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`industry-skeleton-${index}`}
                className="flex items-center gap-2 rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] px-5 py-2"
              >
                <div className={`${skeletonClassName} h-[30px] w-[30px] rounded-full`} />
                <div className={`${skeletonClassName} h-4 w-24`} />
              </div>
            ))
          : industries.map(industry => (
              <div
                key={industry}
                className="flex items-center gap-2 rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] px-5 py-2"
              >
                <span className="[&_svg]:h-[30px] [&_svg]:w-[30px]">{iconForIndustryLabel(industry)}</span>
                <span className="text-body-2 text-deli-white">{industry}</span>
              </div>
            ))}
      </div>
    </div>
  );
};

export default PatentHeaderIndustries;
