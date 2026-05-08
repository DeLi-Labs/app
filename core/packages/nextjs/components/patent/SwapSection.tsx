import CampaignChart from "~~/components/patent/CampaignChart";
import CampaignSwapper from "~~/components/patent/CampaignSwapper";
import { PATENT_CATEGORY_COLORS } from "~~/utils/patentCategoryColors";
import type { CampaignLicenseType, PatentDetailCampaign } from "~~/types";

export type SwapSectionProps = {
  licenseAddress: string;
  hourlyPrices: PatentDetailCampaign["hourlyPrices"];
  currentPrice?: number | string;
  categoryId: string | null;
  image: string;
  licenseType: CampaignLicenseType;
  licenseSymbol: string;
  numeraireAddress: string;
  numeraireSymbol: string;
  isLoading?: boolean;
  className?: string;
};

const SwapSection = ({
  licenseAddress,
  hourlyPrices,
  currentPrice,
  categoryId,
  image,
  licenseType,
  licenseSymbol,
  numeraireAddress,
  numeraireSymbol,
  isLoading = false,
  className,
}: SwapSectionProps) => {
  const colors =
    PATENT_CATEGORY_COLORS[categoryId as keyof typeof PATENT_CATEGORY_COLORS] ?? PATENT_CATEGORY_COLORS.Technology;

  return (
    <section className={`flex h-auto w-full flex-col gap-[30px] lg:h-[500px] lg:flex-row lg:gap-4 ${className ?? ""}`}>
      <div className="flex h-[500px] min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:h-full lg:min-h-0">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-deli-background" />
        ) : (
          <CampaignChart
            licenseAddress={licenseAddress}
            hourlyPrices={hourlyPrices}
            currentPrice={currentPrice}
            colors={colors}
          />
        )}
      </div>
      <div className="flex w-full min-w-0 shrink-0 flex-col lg:h-full lg:w-[500px] lg:min-w-[500px]">
        {isLoading ? (
          <div className="h-full min-h-[320px] w-full animate-pulse rounded-xl bg-deli-background lg:min-h-0" />
        ) : (
          <CampaignSwapper
            licenseAddress={licenseAddress}
            licenseSymbol={licenseSymbol}
            licenseType={licenseType}
            numeraireSymbol={numeraireSymbol}
            numeraireAddress={numeraireAddress}
            image={image}
            colors={colors}
          />
        )}
      </div>
    </section>
  );
};

export default SwapSection;
