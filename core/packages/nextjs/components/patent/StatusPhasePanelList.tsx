import type { CSSProperties } from "react";
import { DEFAULT_IP_STATUS, getIpStatusesForPhaseIndex } from "~~/utils/ipStatusData";

type StatusPhasePanelListProps = {
  phaseIndex: number;
  currentStatusValue?: number | null;
  categoryStartColor: string;
  categoryEndColor: string;
};

const TRACKER_GREY = "var(--deli-grey-light)";
const ROW_HEIGHT = "1.3em";
const ROW_GAP = "5px";
const CONNECTOR_HEIGHT = `calc(${ROW_HEIGHT} + ${ROW_GAP})`;

const StatusPhasePanelList = ({
  phaseIndex,
  currentStatusValue,
  categoryStartColor,
  categoryEndColor,
}: StatusPhasePanelListProps) => {
  const statuses = getIpStatusesForPhaseIndex(phaseIndex);
  const activeStatusValue = currentStatusValue ?? DEFAULT_IP_STATUS;
  const lastReachedIndex = statuses.findLastIndex(status => status.value <= activeStatusValue);
  const isPageFullyCompleted = lastReachedIndex === statuses.length - 1;

  const getTrackerColor = (index: number) => {
    if (lastReachedIndex < 0 || index > lastReachedIndex) return TRACKER_GREY;
    if (isPageFullyCompleted) return categoryEndColor;
    if (index === lastReachedIndex) return categoryStartColor;
    return categoryEndColor;
  };

  const getSegmentStyle = (lowerIndex: number): CSSProperties => {
    if (lowerIndex > lastReachedIndex) {
      return { background: TRACKER_GREY };
    }

    if (isPageFullyCompleted) {
      return { background: categoryEndColor };
    }

    if (lowerIndex === lastReachedIndex && lastReachedIndex > 0) {
      return {
        background: `linear-gradient(to bottom, ${categoryEndColor}, ${categoryStartColor})`,
      };
    }

    return { background: categoryEndColor };
  };

  return (
    <div className="mt-[18px] flex">
      <div className="relative mr-[16px] shrink-0 text-body-2 leading-[1.3em]">
        <div className="flex flex-col gap-[5px]">
          {statuses.map((status, index) => (
            <div key={status.value} className="relative flex h-[1.3em] w-2 items-center justify-center">
              {index < statuses.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-1/2 left-1/2 z-0 w-px -translate-x-1/2"
                  style={{
                    height: CONNECTOR_HEIGHT,
                    ...getSegmentStyle(index + 1),
                  }}
                />
              ) : null}
              <span
                aria-hidden
                className="relative z-10 block h-[5px] w-[5px] shrink-0 rounded-full"
                style={{ backgroundColor: getTrackerColor(index) }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-[5px]">
        {statuses.map(status => {
          const isReached = status.value <= activeStatusValue;

          return (
            <span
              key={status.value}
              className={`text-body-2 leading-[1.3em] ${isReached ? "text-deli-white" : "text-deli-grey-light"}`}
            >
              {status.code} {status.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default StatusPhasePanelList;
