import type { CSSProperties } from "react";
import Image from "next/image";
import { COPY_OWNER_ICON } from "~~/components/assets/common";
import type { PatentCategory } from "~~/utils/patentCategoryColors";
import type { NormalizedCampaignItem } from "~~/components/profile/types";
import {
  categoryIcons,
  categoryStroke,
  formatCampaignDenominationForDisplay,
  formatCompactValue,
  trimWithEllipsis,
  truncateMiddleAddress,
} from "~~/components/profile/utils";
import { isAttachmentProxyImageSrc, storageUriToProxiedImageUrl } from "~~/utils/storageMediaUrl";

/**
 * Vertical category gradient from `globals.css` (`:root` → `--deli-cat-{name}`), start → end top to bottom.
 */
const categoryVerticalBar: Record<PatentCategory, string> = {
  Medicine: "var(--deli-cat-medicine)",
  Engineering: "var(--deli-cat-engineering)",
  Energy: "var(--deli-cat-energy)",
  Technology: "var(--deli-cat-technology)",
  Resources: "var(--deli-cat-resources)",
  Creative: "var(--deli-cat-creative)",
};

const greyStrokeChipStyle: CSSProperties = {
  border: "1px solid transparent",
  backgroundImage: "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-grey)",
  backgroundOrigin: "padding-box, border-box",
  backgroundClip: "padding-box, border-box",
};

const statsNamesRowStyle: CSSProperties = {
  ...greyStrokeChipStyle,
  borderRadius: "9999px",
};

type CampaignCardProps = {
  item: NormalizedCampaignItem;
};

export const CampaignCard = ({ item }: CampaignCardProps) => {
  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(item.licenseAddress);
  };

  const separatorBg = categoryVerticalBar[item.patentCategory as PatentCategory];
  const patentImageSrc = item.patentImage.trim();
  const patentImageUrl = storageUriToProxiedImageUrl(patentImageSrc);

  return (
    <article
      className="flex w-full max-w-full flex-col rounded-xl border border-transparent bg-deli-main p-[10px] md:w-[400px] md:max-w-none md:px-5 md:py-4"
      style={{
        background: `linear-gradient(var(--deli-main),var(--deli-main)) padding-box, ${categoryStroke(item.patentCategory)} border-box`,
      }}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div
          className="box-border flex w-fit max-w-full shrink-0 items-center gap-2 rounded-lg p-2"
          style={greyStrokeChipStyle}
        >
          {patentImageUrl ? (
            <Image
              src={patentImageUrl}
              alt=""
              width={32}
              height={32}
              unoptimized={isAttachmentProxyImageSrc(patentImageUrl)}
              className="size-8 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="size-8 shrink-0 rounded-md bg-deli-main" aria-hidden />
          )}
          <span className="min-w-0 truncate text-body-2 text-deli-white">{item.licenseSymbol}</span>
        </div>
        <div
          className="box-border flex shrink-0 items-center justify-center rounded-lg p-2"
          style={greyStrokeChipStyle}
        >
          <span className="flex items-center">{categoryIcons[item.patentCategory]}</span>
        </div>
      </div>

      <h6 className="m-0 mt-3 truncate text-h6 text-deli-white">{trimWithEllipsis(item.patentName, 30)}</h6>

      <div className="mt-[10px] flex w-full min-w-0 flex-col gap-1 md:flex-row">
        <div className="flex w-full min-w-0 items-stretch gap-1 md:contents">
          <div
            className="box-border flex min-w-0 flex-1 items-center justify-center rounded-lg px-2 py-2 md:order-1 md:flex-none md:shrink-0"
            style={greyStrokeChipStyle}
          >
            <span className="text-center whitespace-nowrap text-body-2 text-deli-white">
              {formatCampaignDenominationForDisplay(item.denominationAmount, item.denominationUnit)}
            </span>
          </div>

          <div
            className="box-border flex min-w-0 flex-1 items-center justify-center rounded-lg px-2 py-2 md:order-3 md:flex-none md:shrink-0"
            style={greyStrokeChipStyle}
          >
            <span className="text-center whitespace-nowrap text-body-3 text-deli-white">{item.numeraireSymbol}</span>
          </div>
        </div>

        <div
          className="box-border flex min-w-0 w-full items-center justify-center gap-2 rounded-lg px-2 py-2 md:order-2 md:min-w-0 md:flex-1"
          style={greyStrokeChipStyle}
        >
          <span className="shrink-0 text-body-2 text-deli-white">Address: </span>
          <span className="min-w-0 flex-1 truncate text-left text-body-2 text-deli-grey-light md:hidden">
            {truncateMiddleAddress(item.licenseAddress, 10, 10)}
          </span>
          <span className="hidden min-w-0 flex-1 truncate text-body-2 text-deli-grey-light md:block md:text-center">
            {truncateMiddleAddress(item.licenseAddress, 4, 2)}
          </span>
          <button
            type="button"
            className="shrink-0 cursor-pointer"
            onClick={handleCopyAddress}
            aria-label="Copy license address"
          >
            {COPY_OWNER_ICON}
          </button>
        </div>
      </div>

      <div className="mt-[25px] flex w-full flex-col gap-px">
        <div
          className="box-border flex w-full items-center justify-between px-[10px] py-1 md:px-6"
          style={statsNamesRowStyle}
        >
          <span className="text-body-3-caps text-deli-grey-light">Market cap</span>
          <span className="text-body-3-caps text-deli-grey-light">price</span>
          <span className="text-body-3-caps text-deli-grey-light">total supply</span>
        </div>
        <div className="flex w-full items-stretch justify-between px-[10px] py-1 md:px-6">
          <span className="flex flex-1 items-center justify-center text-body-3-caps text-deli-white">{`$${formatCompactValue(item.totalEmittedLicensesValueUSD)}`}</span>
          <div className="min-h-[1.3em] w-px shrink-0 self-stretch" style={{ background: separatorBg }} />
          <span className="flex flex-1 items-center justify-center text-body-3-caps text-deli-white">{`$${formatCompactValue(item.currentPrice)}`}</span>
          <div className="min-h-[1.3em] w-px shrink-0 self-stretch" style={{ background: separatorBg }} />
          <span className="flex flex-1 items-center justify-center text-body-3-caps text-deli-white">
            {formatCompactValue(item.totalSupply)}
          </span>
        </div>
      </div>
    </article>
  );
};
