import {
  DECLINE_ICON,
  GROWTH_ICON,
  IG_ICON,
  INVALID_ICON,
  PENDING_ICON,
  SITE_ICON,
  TELEGRAM_ICON,
  VALID_ICON,
  X_ICON,
} from "~~/components/assets/common";

type CampaignItem = {
  licenseAddress: string;
  licenseSymbol: string;
  denomination: {
    unit: string;
    amount: number | string;
  };
};

export type PatentHeaderMarketDataAndSocialsProps = {
  websiteUrl?: string;
  telegramUrl?: string;
  instagramUrl?: string;
  XUrl?: string;
  patentStatus?: string;
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

const linkClassName = `inline-flex items-center gap-3 rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] px-7 py-3 justify-center grow shrink-0`;

const statusCardClassName =
  "inline-flex items-center gap-3 rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] p-2.5 grow shrink-0";

const marketTableCardClassName =
  "w-full rounded-xl border border-transparent bg-deli-background [background:linear-gradient(var(--deli-background),var(--deli-background))_padding-box,var(--deli-stroke-grey)_border-box] p-2.5";

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

const PatentHeaderMarketDataAndSocials = ({
  websiteUrl,
  telegramUrl,
  instagramUrl,
  XUrl,
  patentStatus,
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
  const skeletonClassName = "animate-pulse rounded-md bg-deli-background";
  const normalizedStatus = (patentStatus || "pending").trim().toLowerCase();
  const statusLabel = normalizedStatus === "valid" ? "valid" : normalizedStatus === "invalid" ? "invalid" : "pending";
  const statusIcon = statusLabel === "valid" ? VALID_ICON : statusLabel === "invalid" ? INVALID_ICON : PENDING_ICON;
  const statusTextClassName =
    statusLabel === "valid"
      ? "text-[var(--deli-status-valid)]"
      : statusLabel === "invalid"
        ? "text-[var(--deli-status-invalid)]"
        : "text-[var(--deli-status-pending)]";
  const relativeTime = getRelativeTimeLabel(patentStatusUpdateTimestamp);

  const socialLinks = [
    { label: "Website", url: websiteUrl, icon: SITE_ICON },
    { label: "Telegram", url: telegramUrl, icon: TELEGRAM_ICON },
    { label: "Instagram", url: instagramUrl, icon: IG_ICON },
    { label: "X", url: XUrl, icon: X_ICON },
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

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[30rem] lg:max-w-[30rem]">
      <div className="flex w-full flex-wrap gap-3 lg:flex-nowrap">
        {(isLoading ? socialLinks : socialLinks.filter(item => Boolean(item.url))).map(item =>
          isLoading ? (
            <div key={item.label} className={linkClassName} aria-hidden="true">
              <span className={`${skeletonClassName} h-6.5 w-6.5 rounded-full`} />
              {item.label === "Website" ? <span className={`${skeletonClassName} h-4 w-16`} /> : null}
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
              <span className="inline-flex [&_svg]:w-6.5 [&_svg]:h-6.5">{item.icon}</span>
              {item.label === "Website" ? <span className="text-deli-grey-light text-body-2">Website</span> : null}
            </a>
          ),
        )}
      </div>

      <div className="flex w-full items-center gap-3">
        <div className={statusCardClassName}>
          {isLoading ? (
            renderSkeletonValue("w-20")
          ) : (
            <span className="text-deli-white text-body-2">Patent status:</span>
          )}
          {isLoading ? (
            <>
              {renderSkeletonValue("w-12")}
              <span className={`${skeletonClassName} h-5 w-5 rounded-full`} />
              {renderSkeletonValue("w-16")}
            </>
          ) : (
            <>
              <span className={`text-body-2 ${statusTextClassName}`}>{statusLabel}</span>
              <span className="inline-flex">{statusIcon}</span>
            </>
          )}
          {!isLoading && relativeTime ? <span className="text-deli-grey-light text-body-2">{relativeTime}</span> : null}
        </div>
        <div className={statusCardClassName}>
          {isLoading ? (
            renderSkeletonValue("w-20")
          ) : (
            <span className="text-body-2">
              <span className="text-deli-white">Token ID: </span>
              <span className="text-deli-grey-light">{tokenId ?? "-"}</span>
            </span>
          )}
        </div>
      </div>

      <div className={marketTableCardClassName}>
        {showUnmarketedPatentMessage && !isLoading ? (
          <div className="px-2 py-4">
            <p className="m-0 text-center text-body-2 text-deli-grey-light">Patent is not marketed yet</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 px-2 py-2.5">
              {isLoading ? renderSkeletonValue("w-16") : <span className="text-h3 text-deli-white">Price</span>}
              <div className="inline-flex items-center gap-2">
                {isLoading ? (
                  renderSkeletonValue("w-24")
                ) : (
                  <span className="text-h3 text-deli-white">{`$${formatCompactValue(currentPrice)}`}</span>
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
            <div className="flex items-center justify-between gap-4 px-2 py-2.5">
              {isLoading ? (
                renderSkeletonValue("w-24")
              ) : (
                <span className="text-body-3-caps text-deli-grey-light">market cap</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-20")
              ) : (
                <span className="text-body-2 text-deli-white">{`$${formatCompactValue(totalLicensesValue)}`}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 px-2 py-2.5">
              {isLoading ? (
                renderSkeletonValue("w-28")
              ) : (
                <span className="text-body-3-caps text-deli-grey-light">Trading volume</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-20")
              ) : (
                <span className="text-body-2 text-deli-white">{`$${formatCompactValue(totalTradingVolumeUSD)}`}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 px-2 py-2.5">
              {isLoading ? (
                renderSkeletonValue("w-24")
              ) : (
                <span className="text-body-3-caps text-deli-grey-light">Total supply</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-16")
              ) : (
                <span className="text-body-2 text-deli-white">{formatCompactValue(totalSupply)}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 px-2 py-2.5">
              {isLoading ? (
                renderSkeletonValue("w-24")
              ) : (
                <span className="text-body-3-caps text-deli-grey-light">Retail percent</span>
              )}
              {isLoading ? (
                renderSkeletonValue("w-14")
              ) : (
                <span className="text-body-2 text-deli-white">{formatCompactValue(retailPercent, "%")}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatentHeaderMarketDataAndSocials;
