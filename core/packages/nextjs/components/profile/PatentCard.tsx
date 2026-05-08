import { ARROW_NEXT, patentCardGlow } from "~~/components/assets/common";
import { PATENT_CATEGORY_COLORS } from "~~/utils/patentCategoryColors";
import type { NormalizedIpItem } from "~~/components/profile/types";
import { categoryIcons, categoryStroke, formatCompactValue, trimWithEllipsis } from "~~/components/profile/utils";

type PatentCardProps = {
  item: NormalizedIpItem;
  onStartLicensing?: (item: NormalizedIpItem) => void;
};

export const PatentCard = ({ item, onStartLicensing }: PatentCardProps) => {
  const growthIsPositive = item.growthPercent >= 0;
  const categoryColor = PATENT_CATEGORY_COLORS[item.category as keyof typeof PATENT_CATEGORY_COLORS];

  return (
    <article
      className="relative flex h-[250px] w-full max-w-full flex-col justify-between overflow-hidden rounded-xl border border-transparent bg-deli-main p-[10px] md:w-[400px] md:max-w-none md:px-5 md:py-4"
      style={{
        background: `linear-gradient(var(--deli-main),var(--deli-main)) padding-box, ${categoryStroke(item.category)} border-box`,
      }}
    >
      <div className="pointer-events-none absolute left-0 top-0 -z-0 opacity-90">
        {patentCardGlow(categoryColor.start, categoryColor.end, `patent-${item.tokenId}`)}
      </div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 rounded-xl border border-transparent bg-deli-background px-5 py-2 [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box]">
          <span>{categoryIcons[item.category]}</span>
          <span className="text-body-2 text-deli-white">{item.category}</span>
        </div>
        {onStartLicensing ? (
          <button
            type="button"
            onClick={() => onStartLicensing(item)}
            className="flex cursor-pointer items-center gap-4 border-none bg-transparent p-0 text-body-2 text-deli-white hover:underline"
          >
            <span>Start Licensing</span>
            <span>{ARROW_NEXT}</span>
          </button>
        ) : (
          <a href="/uploadCampaign" className="flex items-center gap-4 text-body-2 text-deli-white hover:underline">
            <span>Start Licensing</span>
            <span>{ARROW_NEXT}</span>
          </a>
        )}
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h4 className="m-0 truncate text-h4 text-deli-white">{trimWithEllipsis(item.name, 18)}</h4>
          <p className="m-0 text-body-3 text-deli-grey-light">{trimWithEllipsis(item.description, 250)}</p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex flex-col items-end gap-[2px]">
            <p
              className={`m-0 text-body-2 ${growthIsPositive ? "text-deli-status-valid" : "text-deli-status-invalid"}`}
            >
              {`${growthIsPositive ? "+" : ""}${item.growthPercent.toFixed(2)}%`}
            </p>
            <p className="m-0 text-body-2 text-deli-grey-light">{`cap: $${formatCompactValue(item.totalEmittedLicensesValueUSD)}`}</p>
          </div>
          <div className="rounded-lg border border-transparent bg-deli-background px-2 py-2 [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box]">
            <span className="text-body-3 text-deli-white">Token ID: </span>
            <span className="text-body-3 text-deli-grey">{item.tokenId}</span>
          </div>
        </div>
      </div>
    </article>
  );
};
