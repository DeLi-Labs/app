"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DECLINE_ICON, GROWTH_ICON } from "~~/components/assets/common";
import { type DiscoverIP } from "~~/types";
import { storageUriToProxiedImageUrl } from "~~/utils/storageMediaUrl";

/** Panel stops shrinking below this on lg+ (icon + columns + padding). */
export const HERO_POPULAR_TOKENS_MIN_WIDTH_PX = 320;
export const HERO_POPULAR_TOKENS_MAX_WIDTH_PX = 510;

const formatCompactValue = (value?: number | string | null, suffix = "") => {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "number") {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${suffix}`;
  }
  return `${value}${suffix}`;
};

const formatPatentName = (name: string) => {
  if (name.length <= 12) return name;
  return `${name.slice(0, 12)}...`;
};

const ChevronRightIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Row = {
  tokenId: number;
  name: string;
  icon: string;
  priceLabel: string;
  growth: number | null;
};

const mapDiscoverItem = (ip: DiscoverIP): Row => {
  const resolvedGrowth = ip.topCampaign?.growth24h ?? ip.growthPercent ?? 0;
  const raw = ip.image?.trim() ?? "";
  const icon =
    !raw || raw.includes("picsum.photos")
      ? "/assets/energy.svg"
      : (storageUriToProxiedImageUrl(raw) ?? "/assets/energy.svg");
  const priceLabel = ip.topCampaign?.currentPrice
    ? `$${ip.topCampaign.currentPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
  return {
    tokenId: ip.tokenId,
    name: ip.name,
    icon,
    priceLabel,
    growth: Number.isFinite(resolvedGrowth) ? resolvedGrowth : null,
  };
};

const skeletonClassName = "animate-pulse rounded-md bg-deli-background";
const tokenRowClassName =
  "grid w-full min-w-0 grid-cols-[32px_minmax(0,1fr)_minmax(0,4.5rem)_minmax(0,3.75rem)] items-center gap-x-1.5 py-1 lg:gap-x-2.5";

const PopularTokensTableSkeleton = () => (
  <ul className="m-0 flex list-none flex-col divide-y divide-white/10 p-0" aria-busy="true" aria-label="Loading tokens">
    {Array.from({ length: 5 }).map((_, i) => (
      <li key={i}>
        <div className={tokenRowClassName} aria-hidden>
          <div className={`${skeletonClassName} size-8 shrink-0 rounded-full`} />
          <div className={`${skeletonClassName} h-5 w-28 max-w-full`} />
          <div className={`${skeletonClassName} h-5 w-[4.5rem] max-w-full`} />
          <div className={`${skeletonClassName} h-8 w-[3.75rem] max-w-full justify-self-end`} />
        </div>
      </li>
    ))}
  </ul>
);

const GrowthBadge = ({ growth }: { growth: number }) => {
  const normalizedGrowth = growth;
  const isGrowthPositive = normalizedGrowth >= 0;
  const growthBadgeBackground = isGrowthPositive ? "var(--deli-growth-positive-bg)" : "var(--deli-growth-negative-bg)";
  const growthBadgeTextClassName = isGrowthPositive
    ? "text-[var(--deli-status-valid)]"
    : "text-[var(--deli-status-invalid)]";
  const growthIcon = isGrowthPositive ? GROWTH_ICON : DECLINE_ICON;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md p-[3px] text-body-1 leading-none ${growthBadgeTextClassName}`}
      style={{ background: growthBadgeBackground }}
    >
      <span className="inline-flex items-center">{formatCompactValue(normalizedGrowth, "%")}</span>
      <span className="inline-flex items-center">{growthIcon}</span>
    </span>
  );
};

export type HeroPopularTokensProps = {
  className?: string;
};

export const HeroPopularTokens = ({ className = "" }: HeroPopularTokensProps) => {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: "0",
          pageSize: "5",
          orderBy: "growthPercent",
          orderDirection: "desc",
        });
        const response = await fetch(`/api/ip/discover?${queryParams.toString()}`);
        if (!response.ok) {
          setRows([]);
          return;
        }
        const data = await response.json();
        if (data?.items?.length) {
          setRows(data.items.map((ip: DiscoverIP) => mapDiscoverItem(ip)));
        } else {
          setRows([]);
        }
      } catch {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div
      className={`mb-0 box-border flex h-[300px] w-full min-h-0 min-w-0 max-w-none shrink-0 flex-col overflow-hidden rounded-[30px] border-2 border-transparent bg-deli-main px-8 py-5 [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-main)_border-box] max-lg:min-w-0 lg:mb-[65px] lg:min-w-[320px] lg:max-w-[510px] ${className}`}
    >
      <div className="mb-[20px] flex min-w-0 shrink-0 items-center justify-between gap-3">
        <h2 className="text-h6 text-deli-white m-0 shrink-0">Popular</h2>
        <Link
          href="/explore"
          className="group inline-flex min-w-0 shrink items-center gap-1 text-deli-grey-light text-body-2 no-underline"
        >
          <span className="relative inline-block min-w-0 truncate after:pointer-events-none after:absolute after:left-0 after:top-[calc(100%+3px)] after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-[300ms] after:ease-out after:content-[''] group-hover:after:scale-x-100">
            Discover all cases
          </span>
          <ChevronRightIcon className="shrink-0 text-deli-grey-light" />
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-start gap-0">
        {isLoading ? (
          <PopularTokensTableSkeleton />
        ) : rows.length === 0 ? (
          <p className="text-deli-grey-light text-body-2 m-0 w-full py-4 text-center">No cases available.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col divide-y divide-white/10 p-0">
            {rows.map(row => (
              <li key={row.tokenId}>
                <button
                  type="button"
                  onClick={() => router.push(`/patent/${row.tokenId}`)}
                  className={`${tokenRowClassName} cursor-pointer border-0 bg-transparent text-left transition-opacity hover:opacity-90`}
                >
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                    <Image src={row.icon} alt={row.name} fill className="object-cover" sizes="32px" />
                  </span>
                  <span className="min-w-0 overflow-hidden truncate text-deli-white text-body-2">
                    {formatPatentName(row.name)}
                  </span>
                  <span className="min-w-0 overflow-hidden truncate whitespace-nowrap text-deli-white text-body-2 tabular-nums">
                    {row.priceLabel}
                  </span>
                  <span className="flex min-w-0 items-center justify-self-end overflow-hidden">
                    {row.growth !== null && Number.isFinite(row.growth) ? (
                      <GrowthBadge growth={row.growth} />
                    ) : (
                      <span className="text-deli-grey-light text-body-2">—</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
