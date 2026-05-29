"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRUMBS_SEPARATOR_ICON } from "~~/components/assets/common";

type CrumbsLabelByHref = Record<string, string>;

type CrumbsNavigationContextValue = {
  labelByHref: CrumbsLabelByHref;
  setCrumbLabel: (href: string, label: string) => void;
  removeCrumbLabel: (href: string) => void;
  clearCrumbLabels: () => void;
};

const CrumbsNavigationContext = createContext<CrumbsNavigationContextValue | null>(null);

export const useCrumbsNavigation = (): CrumbsNavigationContextValue => {
  const value = useContext(CrumbsNavigationContext);
  if (!value) {
    return {
      labelByHref: {},
      setCrumbLabel: () => undefined,
      removeCrumbLabel: () => undefined,
      clearCrumbLabels: () => undefined,
    };
  }
  return value;
};

export const CrumbsNavigationProvider = ({
  children,
  initialLabelByHref,
}: {
  children: React.ReactNode;
  initialLabelByHref?: CrumbsLabelByHref;
}) => {
  const [labelByHref, setLabelByHref] = useState<CrumbsLabelByHref>(initialLabelByHref ?? {});

  const setCrumbLabel = useCallback((href: string, label: string) => {
    setLabelByHref(prev => (prev[href] === label ? prev : { ...prev, [href]: label }));
  }, []);

  const removeCrumbLabel = useCallback((href: string) => {
    setLabelByHref(prev => {
      if (!(href in prev)) return prev;
      const { [href]: removed, ...rest } = prev;
      void removed;
      return rest;
    });
  }, []);

  const clearCrumbLabels = useCallback(() => setLabelByHref({}), []);

  const value = useMemo(
    () => ({
      labelByHref,
      setCrumbLabel,
      removeCrumbLabel,
      clearCrumbLabels,
    }),
    [labelByHref, setCrumbLabel, removeCrumbLabel, clearCrumbLabels],
  );

  return <CrumbsNavigationContext.Provider value={value}>{children}</CrumbsNavigationContext.Provider>;
};

type CrumbsNavigationProps = {
  /**
   * Optional path override.
   * If omitted, current route pathname is used.
   */
  path?: string;
  /**
   * Segment labels override, keyed by decoded segment value.
   * Example: { campaign: "Campaigns", "123": "Details" }
   */
  labelMap?: Record<string, string>;
  /**
   * Home label shown as the first breadcrumb.
   */
  homeLabel?: string;
  /**
   * Hide the home breadcrumb when needed.
   */
  showHome?: boolean;
};

const toTitleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());

export const CrumbsNavigation = ({
  path,
  labelMap = {},
  homeLabel = "Home",
  showHome = true,
}: CrumbsNavigationProps) => {
  const { labelByHref } = useCrumbsNavigation();
  const pathname = usePathname();
  const currentPath = (path ?? pathname ?? "/").split("?")[0].split("#")[0];
  const segments = currentPath.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const decodedSegment = decodeURIComponent(segment);
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = labelMap[decodedSegment] ?? labelByHref[href] ?? toTitleCase(decodedSegment);
    const isLast = index === segments.length - 1;

    return {
      href,
      label,
      isLast,
    };
  });

  const items = [...(showHome ? [{ href: "/", label: homeLabel, isLast: crumbs.length === 0 }] : []), ...crumbs];

  return (
    <nav aria-label="Breadcrumb" className="w-full overflow-x-auto whitespace-nowrap">
      <ul className="m-0 flex list-none items-center gap-2 p-0 text-body-2">
        {items.map((item, index) => (
          <li key={`${item.href}-${item.label}`} className="group flex items-center gap-2">
            {item.isLast ? (
              <span aria-current="page" className="text-deli-white">
                {item.label}
              </span>
            ) : (
              <Link
                className="text-deli-grey-light transition-colors hover:text-deli-white focus-visible:text-deli-white active:text-deli-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-deli-accent"
                href={item.href}
              >
                {item.label}
              </Link>
            )}
            {index < items.length - 1 ? (
              items[index + 1]?.isLast ? (
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center text-deli-white transition-colors"
                >
                  {CRUMBS_SEPARATOR_ICON}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center text-deli-grey-light transition-colors"
                >
                  {CRUMBS_SEPARATOR_ICON}
                </span>
              )
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default CrumbsNavigation;
