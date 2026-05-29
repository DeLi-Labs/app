import { type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { normalizeMultilineText } from "~~/utils/formatting";
import { formatEstimatedDamagesDisplay } from "~~/utils/generateEstimatedDamages";
import { formatTimelineProjectionDisplay } from "~~/utils/generateTimelineProjection";
import { PATENT_CATEGORY_COLORS, type PatentCategory } from "~~/utils/patentCategoryColors";

export type ScrollContainerProps = {
  header: string;
  children: ReactNode;
  maxHeightPx?: number;
  category: PatentCategory;
  isLoading?: boolean;
};

const ScrollContainer = ({
  header,
  children,
  maxHeightPx = 500,
  category = "Technology",
  isLoading = false,
}: ScrollContainerProps) => {
  const CONTAINER_PADDING_PX = 30;
  const innerMaxHeightPx = Math.max(maxHeightPx - CONTAINER_PADDING_PX * 2, 0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const dragStartScrollTopRef = useRef(0);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const colors = PATENT_CATEGORY_COLORS[category];
  const thumbColor = colors.start;

  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollHeight, clientHeight, scrollTop } = el;
    const hasOverflow = scrollHeight > clientHeight;
    setIsOverflowing(hasOverflow);

    if (!hasOverflow) {
      setThumbHeight(0);
      setThumbTop(0);
      return;
    }

    const computedThumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 24);
    const maxThumbTop = clientHeight - computedThumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;
    const computedThumbTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

    setThumbHeight(computedThumbHeight);
    setThumbTop(computedThumbTop);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver(() => updateScrollState());
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [header, children, maxHeightPx]);

  const onScroll = () => {
    updateScrollState();
  };

  const onMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el || !isOverflowing) return;

    dragStartYRef.current = event.clientY;
    dragStartScrollTopRef.current = el.scrollTop;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentEl = scrollContainerRef.current;
      if (!currentEl) return;
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      currentEl.scrollTop = dragStartScrollTopRef.current + deltaY;
      updateScrollState();
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <section
      className="relative w-full h-fit p-[30px] rounded-xl border border-transparent bg-deli-main [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]"
      style={{ maxHeight: `${maxHeightPx}px` }}
    >
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        className={`h-full overflow-y-auto pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isOverflowing ? (isDragging ? "cursor-grabbing select-none" : "cursor-grab") : ""
        }`}
        style={{ maxHeight: `${innerMaxHeightPx}px` }}
      >
        <div className="flex flex-col gap-5">
          {isLoading ? (
            <div className="h-7 w-56 animate-pulse rounded-md bg-deli-background" />
          ) : (
            <h4 className="m-0 text-h4 text-deli-white">{header}</h4>
          )}
          <div className="m-0 text-body-2 text-deli-grey-light whitespace-pre-line">{children}</div>
        </div>
      </div>

      {isOverflowing && (
        <div className="absolute top-[30px] right-[30px] h-[calc(100%-60px)] w-[6px] pointer-events-none">
          <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-deli-grey-light" />
          <div
            className="absolute left-0 w-[6px] rounded-full"
            style={{
              top: `${thumbTop}px`,
              height: `${thumbHeight}px`,
              background: thumbColor,
            }}
          />
        </div>
      )}
    </section>
  );
};

export type TransferabilityFlags = "Transferable" | "NonTransferable";

export type PatentTermsDetailsProps = {
  caseDescription: string; //
  estimatedDamages: string; //
  patentStrength: string; //
  defendantRecoverability: string; //
  timelineProjection: string; //
  territoryRestrictions: string[]; //
  usageRightsDefinition: string; //
  transferabilityFlags: TransferabilityFlags; //
  inventorNames: string; //
  patentNumber: string; //
  jurisdiction: string[]; //
  registrationAuthority: string; //
  patentClassification: string;
  filingDate: string;
  grantDate: string;
  creationTimestamp: string;
  licenseDuration: string; //
  category: PatentCategory; //
  isLoading?: boolean;
  className?: string;
  /** When true, hides the Usage Rights & Licensing Parameters block. */
  hideUsageRightsSection?: boolean;
};

export const mapDurationSecondsToHumanReadable = (durationInSeconds: string): string => {
  const totalSeconds = Number(durationInSeconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "-";

  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = 60 * SECONDS_IN_MINUTE;
  const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
  const SECONDS_IN_MONTH = 30 * SECONDS_IN_DAY;
  const SECONDS_IN_YEAR = 365 * SECONDS_IN_DAY;

  let remaining = Math.floor(totalSeconds);
  const years = Math.floor(remaining / SECONDS_IN_YEAR);
  remaining %= SECONDS_IN_YEAR;
  const months = Math.floor(remaining / SECONDS_IN_MONTH);
  remaining %= SECONDS_IN_MONTH;
  const days = Math.floor(remaining / SECONDS_IN_DAY);
  remaining %= SECONDS_IN_DAY;
  const hours = Math.floor(remaining / SECONDS_IN_HOUR);
  remaining %= SECONDS_IN_HOUR;
  const minutes = Math.floor(remaining / SECONDS_IN_MINUTE);
  const seconds = remaining % SECONDS_IN_MINUTE;

  const parts = [
    years > 0 ? `${years}y` : null,
    months > 0 ? `${months}mo` : null,
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    seconds > 0 ? `${seconds}s` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" ") : "0s";
};

/** Block/chain Unix timestamp in seconds → YYYY-MM-DD (UTC), same shape as filing/grant mock dates. */
export const formatUnixTimestampSecondsToDateString = (unixSeconds: string): string => {
  const sec = Number(unixSeconds);
  if (!Number.isFinite(sec) || sec <= 0) return "-";
  const d = new Date(sec * 1000);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toISOString().slice(0, 10);
};

type TermsInfoFieldProps = {
  label: string;
  value: string;
  isLoading?: boolean;
};

const TermsInfoField = ({ label, value, isLoading = false }: TermsInfoFieldProps) => {
  return (
    <div className="flex flex-col gap-2.5 lg:gap-4">
      {isLoading ? null : <p className="m-0 text-body-2 text-deli-white">{label}</p>}
      {isLoading ? (
        <div className="h-4 w-3/5 animate-pulse rounded-md bg-deli-background" />
      ) : (
        <p className="m-0 text-body-2 text-deli-grey-light">{value || "-"}</p>
      )}
    </div>
  );
};

export const PatentTermsDetails = (props: PatentTermsDetailsProps) => {
  const { className, hideUsageRightsSection = false, ...rest } = props;
  const patentStatsColumn = (
    <div className="flex w-full flex-col gap-2.5 lg:h-full lg:w-1/3">
      <div className="rounded-xl border border-transparent bg-deli-main p-4 [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]">
        <div className="flex flex-col gap-2.5 lg:gap-4">
          <TermsInfoField label="Patent Number:" value={rest.patentNumber} isLoading={rest.isLoading} />
          <TermsInfoField label="Jurisdiction:" value={rest.jurisdiction.join(", ")} isLoading={rest.isLoading} />
          <TermsInfoField
            label="Registration Authority:"
            value={rest.registrationAuthority}
            isLoading={rest.isLoading}
          />
          <TermsInfoField
            label="Estimated Damages:"
            value={formatEstimatedDamagesDisplay(rest.estimatedDamages)}
            isLoading={rest.isLoading}
          />
          <TermsInfoField label="Patent Strength:" value={rest.patentStrength} isLoading={rest.isLoading} />
          <TermsInfoField
            label="Defendant Recoverability:"
            value={rest.defendantRecoverability}
            isLoading={rest.isLoading}
          />
          <TermsInfoField
            label="Timeline Projection:"
            value={formatTimelineProjectionDisplay(rest.timelineProjection)}
            isLoading={rest.isLoading}
          />
        </div>
      </div>

      <div className="rounded-xl border border-transparent bg-deli-main p-4 [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]">
        <div className="flex flex-col gap-2.5 lg:gap-4">
          <TermsInfoField label="Patent Classification:" value={rest.patentClassification} isLoading={rest.isLoading} />
        </div>
      </div>
    </div>
  );

  return (
    <section className={`flex w-full flex-col gap-[30px] lg:flex-row lg:gap-7.5 ${className ?? ""}`}>
      <div className="flex w-full flex-col gap-[30px] lg:w-2/3 lg:gap-6">
        <div id="description">
          <ScrollContainer header="Case Description" category={rest.category} isLoading={rest.isLoading}>
            {rest.isLoading ? (
              <div className="flex flex-col gap-2">
                <div className="h-4 w-full animate-pulse rounded-md bg-deli-background" />
                <div className="h-4 w-5/6 animate-pulse rounded-md bg-deli-background" />
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-deli-background" />
              </div>
            ) : (
              normalizeMultilineText(rest.caseDescription)
            )}
          </ScrollContainer>
        </div>

        {!hideUsageRightsSection ? (
          <ScrollContainer
            header="Litigation Funding Agreement"
            category={rest.category}
            isLoading={rest.isLoading}
          >
            {rest.isLoading ? (
              <div className="flex flex-col gap-3">
                <div className="h-4 w-full animate-pulse rounded-md bg-deli-background" />
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-deli-background" />
                <div className="h-4 w-1/2 animate-pulse rounded-md bg-deli-background" />
                <div className="h-4 w-2/5 animate-pulse rounded-md bg-deli-background" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="m-0 text-body-2 text-deli-grey-light whitespace-pre-line">
                  {normalizeMultilineText(rest.usageRightsDefinition)}
                </p>

                <p className="m-0 text-body-2">
                  <span className="text-deli-white">Territory Restriction: </span>
                  <span className="text-deli-grey-light">{rest.territoryRestrictions.join(", ") || "-"}</span>
                </p>
              </div>
            )}
          </ScrollContainer>
        ) : null}
      </div>

      {patentStatsColumn}
    </section>
  );
};
