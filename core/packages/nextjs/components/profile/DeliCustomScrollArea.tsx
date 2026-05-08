"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type UIEvent,
  type UIEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const DROPDOWN_MAX_HEIGHT_PX = 256;

export type DeliCustomScrollAreaProps = {
  children: ReactNode;
  /** Patent-list default when `thumbStyle` omitted: solid `var(--deli-accent)` thumb */
  thumbStyle?: React.CSSProperties;
  className?: string;
  contentClassName?: string;
  onScroll?: UIEventHandler<HTMLDivElement>;
  /** Fixed max height (dropdowns, profile list). */
  maxHeightPx?: number;
  /** Grow inside a flex column with `min-h-0` parent (e.g. modal body). */
  flexFill?: boolean;
  /** Inset rail + thumb from top/bottom (px). Thumb length/position use the shorter track. */
  railPaddingYPx?: number;
};

export type DeliCustomScrollAreaHandle = {
  getScrollElement: () => HTMLDivElement | null;
};

export const DROPDOWN_SCROLL_MAX_HEIGHT_PX = DROPDOWN_MAX_HEIGHT_PX;

export const DeliCustomScrollArea = forwardRef<DeliCustomScrollAreaHandle, DeliCustomScrollAreaProps>(
  function DeliCustomScrollArea(
    {
      children,
      thumbStyle,
      className = "",
      contentClassName = "",
      onScroll,
      maxHeightPx,
      flexFill = false,
      railPaddingYPx = 0,
    },
    forwardedRef,
  ) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const dragStartYRef = useRef(0);
    const dragStartScrollTopRef = useRef(0);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    useImperativeHandle(forwardedRef, () => ({
      getScrollElement: () => scrollContainerRef.current,
    }));

    const updateScrollState = useCallback(() => {
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

      const pad = Math.max(0, railPaddingYPx);
      const trackHeight = Math.max(clientHeight - 2 * pad, 0);
      if (trackHeight <= 0) {
        setThumbHeight(0);
        setThumbTop(0);
        return;
      }

      const ratio = clientHeight / scrollHeight;
      let computedThumbHeight = Math.max(ratio * trackHeight, 24);
      computedThumbHeight = Math.min(computedThumbHeight, trackHeight);
      const maxThumbTop = trackHeight - computedThumbHeight;
      const maxScrollTop = scrollHeight - clientHeight;
      const thumbTopInTrack = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;

      setThumbHeight(computedThumbHeight);
      setThumbTop(thumbTopInTrack);
    }, [railPaddingYPx]);

    useEffect(() => {
      updateScrollState();
      const el = scrollContainerRef.current;
      if (!el) return;

      const resizeObserver = new ResizeObserver(() => updateScrollState());
      resizeObserver.observe(el);

      return () => resizeObserver.disconnect();
    }, [children, maxHeightPx, flexFill, railPaddingYPx, updateScrollState]);

    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
      updateScrollState();
      onScroll?.(event);
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

    const thumbMergedStyle: React.CSSProperties = thumbStyle ?? { background: "var(--deli-accent)" };

    const scrollStyle: React.CSSProperties | undefined =
      maxHeightPx !== undefined ? { maxHeight: `${maxHeightPx}px` } : undefined;

    const scrollClass = [
      "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      isOverflowing ? "pr-4" : "",
      flexFill ? "min-h-0 flex-1" : "",
      isOverflowing ? (isDragging ? "cursor-grabbing select-none" : "cursor-grab") : "",
      contentClassName,
    ]
      .filter(Boolean)
      .join(" ");

    const outerClass = flexFill
      ? `relative flex min-h-0 w-full flex-1 flex-col ${className}`.trim()
      : `relative w-full ${className}`.trim();

    return (
      <div className={outerClass}>
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseDown={onMouseDown}
          style={scrollStyle}
          className={scrollClass}
        >
          {children}
        </div>
        {isOverflowing && (
          <div
            className="pointer-events-none absolute right-0 w-[6px]"
            style={{
              top: railPaddingYPx,
              bottom: railPaddingYPx,
            }}
          >
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-deli-grey-light" />
            <div
              className="absolute left-0 w-[6px] rounded-full"
              style={{
                top: `${thumbTop}px`,
                height: `${thumbHeight}px`,
                ...thumbMergedStyle,
              }}
            />
          </div>
        )}
      </div>
    );
  },
);

DeliCustomScrollArea.displayName = "DeliCustomScrollArea";
