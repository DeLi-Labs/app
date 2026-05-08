"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { CampaignPeriodName, PatentDetailCampaign } from "~~/types";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

type CampaignChartProps = {
  licenseAddress?: string;
  hourlyPrices: PatentDetailCampaign["hourlyPrices"];
  currentPrice?: number | string;
  colors: {
    start: string;
    end: string;
  };
};

const CHART_POINT_COUNT = 12;
const PERIOD_OPTIONS = [
  { label: "1h", value: "hour" },
  { label: "1d", value: "day" },
  { label: "1w", value: "week" },
  { label: "1m", value: "month" },
] as const;

type PeriodOption = CampaignPeriodName;

type ChartPoint = { timestamp: number; avgPrice: number | null };

function formatChartPrice(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const maxFractionDigits = abs >= 1 ? 4 : abs >= 0.01 ? 6 : 8;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFractionDigits }).format(value);
}

function ChartHoverSync({
  active,
  label,
  coordinateX,
  chartData,
  onHover,
}: {
  active?: boolean;
  label?: string | number;
  coordinateX?: number;
  chartData: ChartPoint[];
  onHover: (state: { point: ChartPoint | null; hoverX: number | null }) => void;
}) {
  useLayoutEffect(() => {
    if (!active || label === undefined) {
      onHover({ point: null, hoverX: null });
      return;
    }
    const ts = typeof label === "number" ? label : Number(label);
    const row = chartData.find(d => d.timestamp === ts);
    onHover({ point: row ?? null, hoverX: coordinateX ?? null });
  }, [active, label, coordinateX, chartData, onHover]);
  return null;
}

const CampaignChart = ({ licenseAddress, hourlyPrices, currentPrice, colors }: CampaignChartProps) => {
  const { targetNetwork } = useTargetNetwork();
  const fillGradientId = useId().replace(/:/g, "");
  const fadedFillGradientId = useId().replace(/:/g, "");
  const leftClipId = useId().replace(/:/g, "");
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("hour");
  const [periodPrices, setPeriodPrices] = useState<PatentDetailCampaign["hourlyPrices"]>(hourlyPrices);
  const [isLoading, setIsLoading] = useState(false);
  const handleHover = useCallback((state: { point: ChartPoint | null; hoverX: number | null }) => {
    setHoveredPoint(state.point);
    setHoverX(state.hoverX);
  }, []);
  const handlePeriodSelect = useCallback((period: PeriodOption) => {
    setSelectedPeriod(period);
  }, []);

  const categoryKey = useMemo(() => {
    const match = colors.start.match(/--deli-cat-([a-z]+)-from/);
    return match?.[1] ?? "technology";
  }, [colors.start]);
  const selectedStrokeBackground = `var(--deli-cat-stroke-${categoryKey})`;
  const selectedTextGradient = `var(--deli-cat-${categoryKey})`;

  useEffect(() => {
    setSelectedPeriod("hour");
    setPeriodPrices(hourlyPrices);
  }, [hourlyPrices, licenseAddress]);

  useEffect(() => {
    if (!licenseAddress) return;
    if (selectedPeriod === "hour") {
      setPeriodPrices(hourlyPrices);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();

    const fetchPeriodData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/campaign/${licenseAddress}?period=${selectedPeriod}&view=avgPrice&limit=${CHART_POINT_COUNT}&chainId=${targetNetwork.id}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch period data (${response.status})`);
        }
        const payload = (await response.json()) as {
          items?: Array<{ timestamp: string; avgPrice: string }>;
        };
        setPeriodPrices(
          (payload.items ?? []).map(item => ({
            timestamp: item.timestamp,
            avgPrice: Number(item.avgPrice),
          })),
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch campaign period avg-price data:", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchPeriodData();
    return () => controller.abort();
  }, [licenseAddress, selectedPeriod, hourlyPrices, targetNetwork.id]);

  const chartData = useMemo(() => {
    // Backend returns latest hourly points in DESC order; use oldest -> newest, cap at 12.
    const oldestToNewest = [...periodPrices].reverse();
    const seriesWithTimestamp =
      oldestToNewest.length > CHART_POINT_COUNT ? oldestToNewest.slice(-CHART_POINT_COUNT) : oldestToNewest;

    const n = seriesWithTimestamp.length;
    const emptyCount = CHART_POINT_COUNT - n;
    const firstSeriesTimestampMs = Number(seriesWithTimestamp[0]?.timestamp ?? 0) * 1000;
    const firstTimestampMs =
      Number.isFinite(firstSeriesTimestampMs) && firstSeriesTimestampMs > 0
        ? firstSeriesTimestampMs - emptyCount * 60 * 60 * 1000
        : Date.now() - (CHART_POINT_COUNT - 1) * 60 * 60 * 1000;

    // Pad at the start with empty points (older hours) so we always render CHART_POINT_COUNT slots.
    return Array.from({ length: CHART_POINT_COUNT }, (_, i) => {
      const timestamp = firstTimestampMs + i * 60 * 60 * 1000;
      if (i < emptyCount) {
        return { timestamp, avgPrice: null as number | null };
      }
      const point = seriesWithTimestamp[i - emptyCount];
      const pointTimestampMs = Number(point?.timestamp ?? 0) * 1000;
      return {
        timestamp: Number.isFinite(pointTimestampMs) && pointTimestampMs > 0 ? pointTimestampMs : timestamp,
        avgPrice: point?.avgPrice ?? null,
      };
    }) satisfies ChartPoint[];
  }, [periodPrices]);
  const fallbackCurrentPrice = useMemo(() => {
    if (typeof currentPrice === "number") return Number.isFinite(currentPrice) ? currentPrice : null;
    if (typeof currentPrice === "string" && currentPrice.trim() !== "") {
      const parsed = Number(currentPrice);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }, [currentPrice]);
  const displayedPrice = hoveredPoint?.avgPrice ?? fallbackCurrentPrice;

  return (
    <div
      className="box-border grid h-full min-h-[500px] w-full grid-rows-[auto_minmax(0,1fr)] rounded-xl border border-transparent bg-deli-main [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]"
      aria-label="Campaign chart"
    >
      {chartData.length > 0 ? (
        <>
          <div className="relative z-10 flex min-h-0 w-full items-start justify-between gap-3 px-5 pt-[18px]">
            {displayedPrice != null ? (
              <div className="pointer-events-none min-w-0 shrink tabular-nums">
                <div className="text-body-3-caps" style={{ color: "var(--deli-light-grey)" }}>
                  Price
                </div>
                <div className="text-h3" style={{ color: colors.start }}>
                  ${formatChartPrice(displayedPrice)}
                </div>
              </div>
            ) : (
              <span className="min-w-0 shrink" aria-hidden="true" />
            )}
            <div className="pointer-events-auto box-border flex shrink-0 flex-row rounded-xl border border-transparent bg-deli-main px-3 py-2 [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]">
              {PERIOD_OPTIONS.map(option => {
                const isSelected = selectedPeriod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePeriodSelect(option.value)}
                    className={`text-body-2 box-border cursor-pointer rounded-xl px-3 py-2 transition-colors ${
                      isSelected ? "border border-transparent bg-deli-main" : "border border-transparent bg-transparent"
                    }`}
                    style={
                      isSelected
                        ? {
                            background: `linear-gradient(var(--deli-main),var(--deli-main)) padding-box, ${selectedStrokeBackground} border-box`,
                          }
                        : undefined
                    }
                  >
                    <span
                      style={
                        isSelected
                          ? {
                              backgroundImage: selectedTextGradient,
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
                            }
                          : { color: "var(--deli-light-grey)" }
                      }
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="relative min-h-0 w-full min-w-0">
            {isLoading ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: colors.start, borderTopColor: "transparent" }}
                  aria-label="Loading chart data"
                />
              </div>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                    {/* Top (near curve): category “from” with 10% transparency (90% opaque). Bottom: category “to” fully transparent. */}
                    <stop offset="0%" stopColor={colors.start} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={colors.end} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id={fadedFillGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                    gradientUnits="objectBoundingBox"
                  >
                    <stop offset="0%" stopColor={colors.start} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={colors.end} stopOpacity={0} />
                  </linearGradient>
                  <clipPath id={leftClipId}>
                    <rect x={0} y={0} width={Math.max(0, hoverX ?? Number.MAX_SAFE_INTEGER)} height={10000} />
                  </clipPath>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  type="number"
                  dataKey="timestamp"
                  domain={["dataMin", "dataMax"]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={value =>
                    new Date(value).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="avgPrice"
                  stroke={colors.start}
                  strokeWidth={2}
                  strokeOpacity={0.45}
                  fill={`url(#${fadedFillGradientId})`}
                  connectNulls={false}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey="avgPrice"
                  stroke={colors.start}
                  strokeWidth={2}
                  fill={`url(#${fillGradientId})`}
                  clipPath={`url(#${leftClipId})`}
                  connectNulls={false}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={{ r: 7, fill: colors.start, stroke: "none" }}
                />
                <Tooltip
                  wrapperStyle={{ visibility: "hidden" }}
                  content={props => (
                    <ChartHoverSync
                      active={props.active}
                      label={props.label}
                      coordinateX={props.coordinate?.x}
                      chartData={chartData}
                      onHover={handleHover}
                    />
                  )}
                  cursor={{ stroke: colors.start, strokeWidth: 1, strokeDasharray: "4 4" }}
                  filterNull={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="col-span-full row-span-2 flex min-h-[200px] flex-1 items-center justify-center text-sm text-base-content/60">
          No hourly price data yet
        </div>
      )}
    </div>
  );
};

export default CampaignChart;
