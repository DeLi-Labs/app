import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ARROW_RIGHT_CIRCLE,
  CROSS_MARK,
  DECLINE_ICON,
  GROWTH_ICON,
  QUESTION_ICON,
  SITE_ICON,
} from "~~/components/assets/common";
import StatusPhasePanelList from "~~/components/patent/StatusPhasePanelList";
import {
  getPatentCategoryColors,
  type PatentCategory,
} from "~~/utils/patentCategoryColors";
import { formatTokenTableDollar } from "~~/utils/formatting";
import {
  IP_STATUS_PHASES,
  getIpStatusPhaseIndex,
} from "~~/utils/ipStatusData";

type CampaignItem = {
  licenseAddress: string;
  licenseSymbol: string;
  denomination: {
    unit: string;
    amount: number | string;
  };
};

export type PatentHeaderMarketDataAndSocialsProps = {
  category: PatentCategory;
  espacenetUrl?: string;
  epoUrl?: string;
  ownerLinkedinUrl?: string;
  ownerWebsiteUrl?: string;
  patentStatus?: string;
  patentStatusValue?: number | null;
  patentStatusUpdateTimestamp?: string | number;
  tokenId?: string | number;
  totalLicensesValue?: number | string;
  currentPrice?: number | string;
  totalSupply?: number | string;
  totalTradingVolumeUSD?: number | string;
  growth24h?: number | string | null;
  retailPercent?: number | string | null;
  campaign?: CampaignItem | CampaignItem[];
  /** When true, replaces price and market stats with an unmarketed message. */
  showUnmarketedPatentMessage?: boolean;
  isLoading?: boolean;
};

type PanelRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const linkClassName = `inline-flex min-w-0 shrink items-center justify-center gap-3 rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] px-7 py-3 grow`;

const idCardClassName =
  "inline-flex w-fit shrink-0 items-center rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] p-2.5";

const marketTableCardClassName =
  "w-full min-w-0 rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] p-2.5";

const statusGreyBorderClassName =
  "[background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box]";

const getStatusCategoryBorderStyle = (fromColor: string, toColor: string): CSSProperties => ({
  background: `linear-gradient(var(--deli-background), var(--deli-background)) padding-box, linear-gradient(to bottom right, ${fromColor}, ${toColor}) border-box`,
});

const statusCardShellClassName =
  "rounded-xl border border-transparent bg-deli-background";

const statusCardInFlowClassName = `relative ${statusCardShellClassName} px-2.5 py-2.5 pr-8`;

const EspacenetIcon = () => (
  <span
    className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#CC0000] text-body-2 font-semibold leading-none text-white"
    aria-hidden
  >
    E
  </span>
);

const formatCompactValue = (value?: number | string | null, suffix = "") => {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "number") {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${suffix}`;
  }
  return `${value}${suffix}`;
};

const normalizeGrowthValue = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRelativeTimeLabel = (timestamp?: string | number) => {
  if (timestamp === undefined || timestamp === null || timestamp === "") return "";

  let parsedMs: number | null = null;
  if (typeof timestamp === "number") {
    parsedMs = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  } else {
    const asNumber = Number(timestamp);
    if (!Number.isNaN(asNumber)) {
      parsedMs = asNumber < 1_000_000_000_000 ? asNumber * 1000 : asNumber;
    } else {
      const asDate = Date.parse(timestamp);
      if (!Number.isNaN(asDate)) parsedMs = asDate;
    }
  }

  if (parsedMs === null) return "";

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - parsedMs) / 1000));
  const units = [
    { label: "d", value: 86400 },
    { label: "h", value: 3600 },
    { label: "m", value: 60 },
    { label: "s", value: 1 },
  ];

  for (const unit of units) {
    if (diffInSeconds >= unit.value) {
      return `(${Math.floor(diffInSeconds / unit.value)} ${unit.label} ago)`;
    }
  }

  return "(0 s ago)";
};

type SocialLinkItem = {
  label: string;
  url?: string;
  icon: ReactNode;
  showLabel?: boolean;
};

const PatentHeaderMarketDataAndSocials = ({
  category,
  espacenetUrl,
  epoUrl,
  ownerLinkedinUrl,
  ownerWebsiteUrl,
  patentStatus,
  patentStatusValue,
  patentStatusUpdateTimestamp,
  tokenId,
  totalLicensesValue,
  currentPrice,
  totalSupply,
  totalTradingVolumeUSD,
  growth24h,
  retailPercent,
  showUnmarketedPatentMessage = false,
  isLoading = false,
}: PatentHeaderMarketDataAndSocialsProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const statusSlotRef = useRef<HTMLDivElement>(null);
  const statusCollapsedRef = useRef<HTMLDivElement>(null);
  const marketTableRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const expandedTargetRef = useRef<PanelRect | null>(null);
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const [expandedPanelRect, setExpandedPanelRect] = useState<PanelRect | null>(null);
  const [statusPanelPageIndex, setStatusPanelPageIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const skeletonClassName = "animate-pulse rounded-md bg-deli-background";
  const statusLabel = patentStatus?.trim() || "Unknown";
  const relativeTime = getRelativeTimeLabel(patentStatusUpdateTimestamp);
  const categoryColors = getPatentCategoryColors(category);
  const statusCategoryBorderStyle = getStatusCategoryBorderStyle(categoryColors.start, categoryColors.end);
  const showCategoryStatusBorder = hasMounted && !isLoading;

  const measureCollapsedRect = useCallback((): PanelRect | null => {
    const section = sectionRef.current;
    const collapsed = statusCollapsedRef.current;
    if (!section || !collapsed) return null;

    const sectionRect = section.getBoundingClientRect();
    const collapsedRect = collapsed.getBoundingClientRect();

    return {
      top: collapsedRect.top - sectionRect.top,
      left: collapsedRect.left - sectionRect.left,
      width: collapsedRect.width,
      height: collapsedRect.height,
    };
  }, []);

  const measureExpandedRect = useCallback((): PanelRect | null => {
    const section = sectionRef.current;
    const market = marketTableRef.current;
    const collapsed = statusCollapsedRef.current;
    const slot = statusSlotRef.current;
    if (!section || !market) return null;

    const sectionRect = section.getBoundingClientRect();
    const marketRect = market.getBoundingClientRect();
    const anchorTop = collapsed
      ? collapsed.getBoundingClientRect().top
      : slot?.getBoundingClientRect().top;
    if (anchorTop === undefined) return null;

    const top = anchorTop - sectionRect.top;

    return {
      top,
      left: 0,
      width: section.offsetWidth,
      height: Math.max(0, marketRect.bottom - anchorTop + 30),
    };
  }, []);

  useLayoutEffect(() => {
    if (!isStatusExpanded || !expandedTargetRef.current) return;

    const target = expandedTargetRef.current;
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setExpandedPanelRect(target);
      });
    });

    return () => {
      cancelAnimationFrame(outerFrame);
      if (innerFrame) cancelAnimationFrame(innerFrame);
    };
  }, [isStatusExpanded]);

  useLayoutEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isStatusExpanded) return;

    const handleResize = () => {
      const expanded = measureExpandedRect();
      if (expanded) setExpandedPanelRect(expanded);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isStatusExpanded, measureExpandedRect]);

  const handleOpenStatusPanel = () => {
    const collapsed = measureCollapsedRect();
    const expanded = measureExpandedRect();
    if (!collapsed || !expanded) return;

    expandedTargetRef.current = expanded;
    setStatusPanelPageIndex(getIpStatusPhaseIndex(patentStatusValue));
    setExpandedPanelRect(collapsed);
    setIsStatusExpanded(true);
  };

  const handleCloseStatusPanel = () => {
    const collapsed = measureCollapsedRect();
    if (collapsed) {
      setExpandedPanelRect(collapsed);
    }

    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsStatusExpanded(false);
      setExpandedPanelRect(null);
      expandedTargetRef.current = null;
      closeTimeoutRef.current = null;
    }, 300);
  };

  const expandedPanelStyle: CSSProperties | undefined = expandedPanelRect
    ? {
        top: expandedPanelRect.top,
        left: expandedPanelRect.left,
        width: expandedPanelRect.width,
        height: expandedPanelRect.height,
      }
    : undefined;

  const socialLinks: SocialLinkItem[] = [
    { label: "Espacenet", url: espacenetUrl, icon: <EspacenetIcon /> },
    {
      label: "EPO",
      url: epoUrl,
      icon: (
        <Image src="/assets/epo.jpg" alt="" width={26} height={26} className="h-[26px] w-[26px] rounded-md object-cover" />
      ),
    },
    {
      label: "Owner's LinkedIn",
      url: ownerLinkedinUrl,
      icon: (
        <Image
          src="/assets/linkedin.jpg"
          alt=""
          width={26}
          height={26}
          className="h-[26px] w-[26px] rounded-md object-cover"
        />
      ),
    },
    { label: "Website", url: ownerWebsiteUrl, icon: SITE_ICON, showLabel: true },
  ];
  const normalizedGrowth = normalizeGrowthValue(growth24h);
  const isGrowthPositive = (normalizedGrowth ?? 0) > 0;
  const growthBadgeBackground = isGrowthPositive ? "var(--deli-growth-positive-bg)" : "var(--deli-growth-negative-bg)";
  const growthBadgeTextClassName = isGrowthPositive
    ? "text-[var(--deli-status-valid)]"
    : "text-[var(--deli-status-invalid)]";
  const growthIcon = isGrowthPositive ? GROWTH_ICON : DECLINE_ICON;
  const renderSkeletonValue = (widthClassName: string) => (
    <span className={`${skeletonClassName} inline-flex h-5 ${widthClassName}`} />
  );

  const renderStatusToggleButton = (expanded: boolean, onClick: () => void) =>
    !isLoading ? (
      <button
        type="button"
        onClick={onClick}
        className="absolute right-2.5 top-2.5 inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 [&_svg]:h-[18px] [&_svg]:w-[18px]"
        aria-label={expanded ? "Close status details" : "Show status details"}
      >
        {expanded ? CROSS_MARK : QUESTION_ICON}
      </button>
    ) : null;

  const renderStatusPanelNavButton = (direction: "left" | "right", disabled: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-[20px] w-[20px] items-center justify-center border-0 bg-transparent p-0 [&_svg]:h-[20px] [&_svg]:w-[20px] ${
        disabled ? "cursor-default [&_rect]:stroke-[#9FA1A1] [&_path]:stroke-[#9FA1A1]" : "cursor-pointer"
      }`}
      aria-label={direction === "left" ? "Previous status phase" : "Next status phase"}
    >
      <span className={direction === "left" ? "inline-flex scale-x-[-1]" : "inline-flex"}>{ARROW_RIGHT_CIRCLE}</span>
    </button>
  );

  const canGoToPreviousStatusPage = statusPanelPageIndex > 0;
  const canGoToNextStatusPage = statusPanelPageIndex < IP_STATUS_PHASES.length - 1;

  const renderExpandedStatusPanelContent = () => (
    <div className="flex min-h-0 flex-1 flex-col pt-[11px] pr-[11px] pb-[11px] pl-[23px]">
      <span className="text-body-2-caps">
        <span className="text-deli-grey-light">STATUS: </span>
        <span className="text-deli-white">{IP_STATUS_PHASES[statusPanelPageIndex]}</span>
      </span>
      <StatusPhasePanelList
        phaseIndex={statusPanelPageIndex}
        currentStatusValue={patentStatusValue}
        categoryStartColor={categoryColors.start}
        categoryEndColor={categoryColors.end}
      />
      <div className="min-h-0 flex-1" aria-hidden="true" />
      <div className="flex justify-end gap-[10px]">
        {renderStatusPanelNavButton(
          "left",
          !canGoToPreviousStatusPage,
          () => setStatusPanelPageIndex(current => Math.max(0, current - 1)),
        )}
        {renderStatusPanelNavButton(
          "right",
          !canGoToNextStatusPage,
          () => setStatusPanelPageIndex(current => Math.min(IP_STATUS_PHASES.length - 1, current + 1)),
        )}
      </div>
    </div>
  );

  const renderStatusHeader = () => (
    <>
      {isLoading ? (
        renderSkeletonValue("w-20")
      ) : (
        <span className="text-deli-white text-body-2">Status:</span>
      )}
      {isLoading ? (
        <>
          {renderSkeletonValue("w-12")}
          {renderSkeletonValue("w-16")}
        </>
      ) : (
        <span className="min-w-0 text-body-2 text-deli-white">{statusLabel}</span>
      )}
      {!isLoading && relativeTime ? <span className="text-deli-grey-light text-body-2">{relativeTime}</span> : null}
    </>
  );

  return (
    <div ref={sectionRef} className="relative flex w-full min-w-0 max-w-full flex-col gap-3">
      <div className="flex w-full min-w-0 flex-wrap gap-3">
        {(isLoading ? socialLinks : socialLinks.filter(item => Boolean(item.url))).map(item =>
          isLoading ? (
            <div key={item.label} className={linkClassName} aria-hidden="true">
              <span className={`${skeletonClassName} h-6.5 w-6.5 rounded-full`} />
              {item.showLabel ? <span className={`${skeletonClassName} h-4 w-16`} /> : null}
            </div>
          ) : (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className={linkClassName}
              aria-label={item.label}
            >
              <span className="inline-flex [&_svg]:h-6.5 [&_svg]:w-6.5">{item.icon}</span>
              {item.showLabel ? <span className="text-deli-grey-light text-body-2">Website</span> : null}
            </a>
          ),
        )}
      </div>

      <div className="flex w-full items-stretch gap-3">
        <div className={idCardClassName}>
          {isLoading ? (
            renderSkeletonValue("w-20")
          ) : (
            <span className="text-body-2">
              <span className="text-deli-white">ID: </span>
              <span className="text-deli-grey-light">{tokenId ?? "-"}</span>
            </span>
          )}
        </div>
        <div ref={statusSlotRef} className="min-w-0 flex-1">
          <div
            ref={statusCollapsedRef}
            className={`${statusCardInFlowClassName} flex w-full items-center justify-center gap-1.5${
              isStatusExpanded ? " invisible pointer-events-none" : ""
            }${showCategoryStatusBorder ? "" : ` ${statusGreyBorderClassName}`}`}
            style={showCategoryStatusBorder ? statusCategoryBorderStyle : undefined}
            aria-hidden={isStatusExpanded}
          >
            {!isStatusExpanded ? renderStatusToggleButton(false, handleOpenStatusPanel) : null}
            <div className="flex items-center justify-center gap-1.5">{renderStatusHeader()}</div>
          </div>
        </div>
      </div>

      {isStatusExpanded && expandedPanelRect ? (
        <div
          className={`absolute z-20 flex flex-col items-stretch justify-start overflow-hidden transition-[top,left,width,height,background] duration-300 ease-in-out ${statusCardShellClassName} ${statusGreyBorderClassName}`}
          style={expandedPanelStyle}
        >
          {renderStatusToggleButton(true, handleCloseStatusPanel)}
          {renderExpandedStatusPanelContent()}
        </div>
      ) : null}

      <div
        ref={marketTableRef}
        className={marketTableCardClassName}
        aria-hidden={isStatusExpanded}
        style={isStatusExpanded ? { pointerEvents: "none" } : undefined}
      >
        {showUnmarketedPatentMessage && !isLoading ? (
          <div className="px-2 py-4">
            <p className="m-0 text-center text-body-2 text-deli-grey-light">No funding campaign available</p>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 items-center justify-between gap-2 px-2 py-2.5 sm:gap-4">
              {isLoading ? renderSkeletonValue("w-16") : <span className="shrink-0 text-h3 text-deli-white">Price</span>}
              <div className="inline-flex min-w-0 items-center justify-end gap-2">
                {isLoading ? (
                  renderSkeletonValue("w-24")
                ) : (
                  <span className="min-w-0 truncate text-h3 text-deli-white">
                    {formatTokenTableDollar(currentPrice, { alwaysShowCents: true })}
                  </span>
                )}
                {!isLoading && normalizedGrowth !== null ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1 py-1.5 text-body-1 leading-none ${growthBadgeTextClassName}`}
                    style={{ background: growthBadgeBackground }}
                  >
                    <span>{formatCompactValue(normalizedGrowth, "%")}</span>
                    <span className="inline-flex">{growthIcon}</span>
                  </span>
                ) : null}
              </div>
            </div>
            <div className="h-px mx-2 mt-1 mb-0.5" style={{ background: "var(--deli-stroke-grey)" }} />
            <div className="flex min-w-0 items-center justify-between gap-2 px-2 py-2.5 sm:gap-4">
              {isLoading ? (
                renderSkeletonValue("w-24")
              ) : (
                <span className="shrink-0 text-body-3-caps text-deli-grey-light">funding target</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-20")
              ) : (
                <span className="min-w-0 truncate text-right text-body-2 text-deli-white">
                  {formatTokenTableDollar(totalLicensesValue)}
                </span>
              )}
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 px-2 py-2.5 sm:gap-4">
              {isLoading ? (
                renderSkeletonValue("w-28")
              ) : (
                <span className="shrink-0 text-body-3-caps text-deli-grey-light">Trading volume</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-20")
              ) : (
                <span className="min-w-0 truncate text-right text-body-2 text-deli-white">
                  {formatTokenTableDollar(totalTradingVolumeUSD)}
                </span>
              )}
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 px-2 py-2.5 sm:gap-4">
              {isLoading ? (
                renderSkeletonValue("w-24")
              ) : (
                <span className="shrink-0 text-body-3-caps text-deli-grey-light">Total supply</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-16")
              ) : (
                <span className="min-w-0 truncate text-right text-body-2 text-deli-white">
                  {formatCompactValue(totalSupply)}
                </span>
              )}
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 px-2 py-2.5 sm:gap-4">
              {isLoading ? (
                renderSkeletonValue("w-24")
              ) : (
                <span className="shrink-0 text-body-3-caps text-deli-grey-light">Retail percent</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-14")
              ) : (
                <span className="min-w-0 truncate text-right text-body-2 text-deli-white">
                  {formatCompactValue(retailPercent, "%")}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatentHeaderMarketDataAndSocials;
