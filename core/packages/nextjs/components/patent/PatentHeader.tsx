import PatentHeaderGeneralData, { PatentHeaderGeneralDataProps } from "./PatentHeaderGeneralData";
import PatentHeaderIndustries, { PatentHeaderIndustriesProps } from "./PatentHeaderIndustries";
import PatentHeaderMarketDataAndSocials, {
  PatentHeaderMarketDataAndSocialsProps,
} from "./PatentHeaderMarketDataAndSocials";
import { patentHeaderGlowSvg } from "~~/components/assets/common";
import { PATENT_CATEGORY_COLORS, type PatentCategory } from "~~/utils/patentCategoryColors";

export type { PatentCategory };

export type PatentHeaderProps = {
  category: PatentCategory;
  patentHeaderGeneralData: PatentHeaderGeneralDataProps;
  patentHeaderMarketDataAndSocials: PatentHeaderMarketDataAndSocialsProps;
  patentHeaderIndustries: PatentHeaderIndustriesProps;
  isLoading?: boolean;
};

export const PatentHeader = ({
  category,
  patentHeaderGeneralData,
  patentHeaderMarketDataAndSocials,
  patentHeaderIndustries,
  isLoading = false,
}: PatentHeaderProps) => {
  const colors = PATENT_CATEGORY_COLORS[category] ?? PATENT_CATEGORY_COLORS.Technology;

  return (
    <section className="relative flex w-full flex-col gap-8 overflow-hidden rounded-xl border border-transparent bg-deli-main px-[10px] py-5 [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box] lg:p-11">
      {!isLoading ? (
        <div className="absolute bottom-0 right-0">{patentHeaderGlowSvg(colors.start, colors.end)}</div>
      ) : null}
      <div className="relative z-10 flex w-full min-w-0 flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
        <PatentHeaderGeneralData {...patentHeaderGeneralData} isLoading={isLoading} />
        <div className="hidden min-w-0 lg:block lg:min-w-[280px] lg:max-w-[30rem] lg:flex-[0_1_30rem]">
          <PatentHeaderMarketDataAndSocials {...patentHeaderMarketDataAndSocials} category={category} isLoading={isLoading} />
        </div>
      </div>
      <PatentHeaderIndustries {...patentHeaderIndustries} isLoading={isLoading} />
      <div className="relative z-10 w-full lg:hidden">
        <PatentHeaderMarketDataAndSocials {...patentHeaderMarketDataAndSocials} category={category} isLoading={isLoading} />
      </div>
    </section>
  );
};

export default PatentHeader;
