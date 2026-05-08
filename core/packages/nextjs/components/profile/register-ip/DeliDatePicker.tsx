"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DATE_PICKER_ICON, DROPDOWN_ICON } from "~~/components/assets/common";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const toISODateString = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const parseISODate = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, day] = s.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
};

const formatUsSlashed = (iso: string) => {
  const d = parseISODate(iso);
  if (!d) return iso;
  return `${pad2(d.getMonth() + 1)} / ${pad2(d.getDate())} / ${d.getFullYear()}`;
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function buildMonthGrid(viewYear: number, viewMonth: number) {
  const first = new Date(viewYear, viewMonth, 1);
  const weekday0 = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: { d: Date; inCurrent: boolean }[] = [];
  const prevLast = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = 0; i < weekday0; i++) {
    const day = prevLast - weekday0 + i + 1;
    cells.push({ d: new Date(viewYear, viewMonth - 1, day), inCurrent: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ d: new Date(viewYear, viewMonth, day), inCurrent: true });
  }
  const rem = cells.length % 7;
  const padEnd = rem === 0 ? 0 : 7 - rem;
  for (let i = 1; i <= padEnd; i++) {
    cells.push({ d: new Date(viewYear, viewMonth + 1, i), inCurrent: false });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].d;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ d: next, inCurrent: false });
  }
  return cells.slice(0, 42);
}

const triggerBorder = (open: boolean) => (open ? "var(--deli-stroke-main)" : "var(--deli-stroke-grey)");

const selectedDayStyle: CSSProperties = {
  border: "1px solid transparent",
  backgroundImage: "linear-gradient(var(--deli-main), var(--deli-main)), var(--deli-stroke-main)",
  backgroundOrigin: "padding-box, border-box",
  backgroundClip: "padding-box, border-box",
};

const navShellIdle: CSSProperties = {
  border: "1px solid transparent",
  backgroundColor: "transparent",
  backgroundImage: "none",
};

const navShellHover: CSSProperties = {
  border: "1px solid transparent",
  backgroundImage: "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-grey)",
  backgroundOrigin: "padding-box, border-box",
  backgroundClip: "padding-box, border-box",
};

const navShellActive: CSSProperties = {
  border: "1px solid transparent",
  backgroundImage: "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-main)",
  backgroundOrigin: "padding-box, border-box",
  backgroundClip: "padding-box, border-box",
};

function MonthNavButton({
  direction,
  onClick,
  ariaLabel,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  ariaLabel: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const shell = pressed ? navShellActive : hovered ? navShellHover : navShellIdle;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200"
      style={shell}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      <span
        className={`flex items-center justify-center text-deli-grey transition-colors duration-200 [&_path]:fill-current ${
          hovered || pressed ? "text-deli-white" : ""
        }`}
        style={{ transform: direction === "prev" ? "rotate(180deg)" : "rotate(0deg)" }}
      >
        {DROPDOWN_ICON}
      </span>
    </button>
  );
}

type DeliDatePickerProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
};

export const DeliDatePicker = ({ label, value, onChange, required }: DeliDatePickerProps) => {
  const [open, setOpen] = useState(false);
  const parsed = parseISODate(value);
  const initialView = parsed ?? new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 320 });

  const syncPanel = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPanelPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 280),
    });
  }, []);

  useEffect(() => {
    const p = parseISODate(value);
    if (p) {
      setViewYear(p.getFullYear());
      setViewMonth(p.getMonth());
    }
  }, [value]);

  useLayoutEffect(() => {
    if (!open) return;
    syncPanel();
    window.addEventListener("resize", syncPanel);
    window.addEventListener("scroll", syncPanel, true);
    return () => {
      window.removeEventListener("resize", syncPanel);
      window.removeEventListener("scroll", syncPanel, true);
    };
  }, [open, syncPanel]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const n = e.target as Node;
      if (anchorRef.current?.contains(n)) return;
      if (panelRef.current?.contains(n)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const calendarPanel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="rounded-xl border border-transparent bg-deli-background p-3 shadow-lg"
            style={{
              position: "fixed",
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
              zIndex: 250,
              backgroundImage:
                "linear-gradient(var(--deli-background),var(--deli-background)) padding-box, var(--deli-stroke-grey) border-box",
              backgroundOrigin: "padding-box, border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <MonthNavButton direction="prev" onClick={() => shiftMonth(-1)} ariaLabel="Previous month" />
              <span className="text-body-2-caps text-deli-white [font-variant-numeric:lining-nums]">{monthTitle}</span>
              <MonthNavButton direction="next" onClick={() => shiftMonth(1)} ariaLabel="Next month" />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-body-3-caps text-deli-grey-light">
                  {d}
                </div>
              ))}
              {grid.map(({ d, inCurrent }, i) => {
                const iso = toISODateString(d);
                const isSelected = value === iso;
                return (
                  <button
                    key={`${iso}-${i}`}
                    type="button"
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-body-2 ${
                      inCurrent ? "text-deli-white" : "text-deli-grey"
                    } ${isSelected ? "" : "hover:bg-deli-hover"}`}
                    style={isSelected ? selectedDayStyle : undefined}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className="relative flex w-full min-w-0 flex-col gap-2">
      <span className="text-h6 text-deli-white">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group box-border flex h-11 w-full cursor-pointer items-stretch overflow-hidden rounded-xl border border-transparent bg-deli-background text-left"
        style={{
          backgroundImage: `linear-gradient(var(--deli-background),var(--deli-background)) padding-box, ${triggerBorder(open)} border-box`,
        }}
      >
        <span
          className={`flex min-h-11 min-w-0 flex-1 items-center px-3 text-body-2 ${value ? "text-deli-white" : "text-deli-grey-light"}`}
        >
          {value ? formatUsSlashed(value) : "mm / dd / yyyy"}
          {required && !value ? <span className="text-deli-grey-light"> *</span> : null}
        </span>
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-deli-grey transition-colors duration-200 group-hover:text-deli-white [&_path]:fill-current"
          style={{
            backgroundImage: `linear-gradient(var(--deli-background),var(--deli-background)) padding-box, ${triggerBorder(open)} border-box`,
          }}
        >
          {DATE_PICKER_ICON}
        </span>
      </button>
      {calendarPanel}
    </div>
  );
};
