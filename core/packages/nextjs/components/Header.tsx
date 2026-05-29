"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { HEADER_BURGER_MENU, HEADER_CLOSE_ICON } from "~~/components/assets/common";
import { useProfileHeaderMenuContext } from "./profile/ProfileHeaderMenuContext";
import { ProfileSidebarContent } from "./profile/ProfileSidebarContent";

type HeaderMenuLink = {
  label: string;
  href: string;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/#hero",
  },
  {
    label: "Categories",
    href: "/#ip-category",
  },
  {
    label: "About us",
    href: "/#about-us",
  },
  {
    label: "All Cases",
    href: "/explore",
  },
  {
    label: "FAQ",
    href: "/#faq",
  },
];

type HeaderMenuLinksProps = {
  mobile?: boolean;
  onLinkClick?: () => void;
};

export const HeaderMenuLinks = ({ mobile = false, onLinkClick }: HeaderMenuLinksProps) => {
  const pathname = usePathname();

  const onAnchorNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;
    const path = href.slice(0, hashIndex) || "/";
    const hash = href.slice(hashIndex + 1);
    if (!hash || pathname !== path) return;
    e.preventDefault();
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", href);
    }
  };

  return (
    <>
      {menuLinks.map(({ label, href }) => {
        const isActive = !href.includes("#") && pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              onClick={e => {
                onAnchorNavClick(e, href);
                onLinkClick?.();
              }}
              className={`${
                isActive ? "text-deli-accent" : "text-deli-white"
              } hover:text-deli-accent active:!text-deli-white transition-all flex items-center ${
                mobile ? "justify-start py-0 px-0" : "justify-center py-2 px-4"
              } ${mobile ? "text-h3" : "text-body-2"}`}
            >
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

export const Header = () => {
  const pathname = usePathname();
  const { config: profileHeaderMenuConfig } = useProfileHeaderMenuContext();
  const isProfileRoute =
    pathname === "/profile" ||
    pathname?.startsWith("/profile/") ||
    pathname === "/v2/profile" ||
    pathname?.startsWith("/v2/profile/");
  const isRegistrationRoute =
    pathname === "/registration" ||
    pathname?.startsWith("/registration/") ||
    pathname === "/v2/registration" ||
    pathname?.startsWith("/v2/registration/");
  const hideLaunchApp = isProfileRoute || isRegistrationRoute;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileSheetVisible, setIsProfileSheetVisible] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!(isMobileMenuOpen && isProfileRoute)) {
      setIsProfileSheetVisible(false);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setIsProfileSheetVisible(true);
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isMobileMenuOpen, isProfileRoute]);

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex justify-center px-5 py-10 lg:px-0 lg:py-8">
      <div className="flex items-center justify-between px-5 py-3 lg:px-10 bg-[#070A0D]/80 backdrop-blur-xl rounded-full w-[1350px] max-w-[95%] shadow-2xl">
        <div className="flex items-center">
          <Link href="/" passHref className="flex items-center gap-1 lg:gap-2 group shrink-0 w-[100px] h-[20px] lg:w-auto lg:h-auto">
            <span className="text-logo text-deli-white group-hover:text-deli-accent transition-colors">deli</span>
            <div className="relative w-5 h-5 shrink-0 lg:w-8 lg:h-8 group-hover:scale-110 transition-transform">
              <Image alt="deli labs logo" fill src="/assets/logo-vector.svg" className="brightness-125" />
            </div>
            <span className="text-logo text-deli-white group-hover:text-deli-accent transition-colors">labs</span>
          </Link>
        </div>

        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
          <ul className="flex flex-nowrap menu menu-horizontal px-1 gap-4">
            <HeaderMenuLinks />
          </ul>
        </div>

        <div className="flex items-center gap-4">
          {!hideLaunchApp ? (
            <Link href="/registration" className="hidden lg:flex items-center gap-[14px] p-0 transition-all group">
              <span className="text-body-2 text-white group-hover:text-deli-accent font-normal leading-[130%] transition-colors">
                Launch App
              </span>
              <div className="w-8 h-8 rounded-full border border-white group-hover:border-deli-accent flex items-center justify-center bg-transparent shrink-0 transition-all">
                <div className="relative w-full h-full flex items-center justify-center">
                  <ChevronRightIcon className="absolute h-[10px] w-auto text-white stroke-[2.5px] group-hover:opacity-0 transition-opacity" />
                  <ArrowRightIcon className="absolute h-[10px] w-auto text-deli-accent stroke-[2.5px] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost p-2 hover:bg-white/5 lg:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            {HEADER_BURGER_MENU}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && !isProfileRoute ? (
        <div className="fixed inset-0 z-[60] bg-deli-background p-[61px_48px] lg:hidden">
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <Link href="/" passHref className="flex items-center gap-1 group shrink-0 w-[100px] h-[20px]" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-logo text-deli-white group-hover:text-deli-accent transition-colors">deli</span>
                <div className="relative w-5 h-5 shrink-0 group-hover:scale-110 transition-transform">
                  <Image alt="deli labs logo" fill src="/assets/logo-vector.svg" className="brightness-125" />
                </div>
                <span className="text-logo text-deli-white group-hover:text-deli-accent transition-colors">labs</span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost p-0 min-h-0 h-auto hover:bg-transparent"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                {HEADER_CLOSE_ICON}
              </button>
            </div>
            <ul className="menu p-0 w-full gap-8">
              <HeaderMenuLinks mobile onLinkClick={() => setIsMobileMenuOpen(false)} />
            </ul>
          </div>
        </div>
      ) : null}
      {isMobileMenuOpen && isProfileRoute ? (
        <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-md lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="relative h-full">
            <div className="flex items-start justify-between px-[48px] pt-[61px]">
              <Link href="/" passHref className="flex items-center gap-1 group shrink-0 w-[100px] h-[20px]" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-logo text-deli-white group-hover:text-deli-accent transition-colors">deli</span>
                <div className="relative w-5 h-5 shrink-0 group-hover:scale-110 transition-transform">
                  <Image alt="deli labs logo" fill src="/assets/logo-vector.svg" className="brightness-125" />
                </div>
                <span className="text-logo text-deli-white group-hover:text-deli-accent transition-colors">labs</span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost p-0 min-h-0 h-auto hover:bg-transparent"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                {HEADER_CLOSE_ICON}
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 w-full overflow-hidden" onClick={e => e.stopPropagation()}>
              <div
                className={`w-full rounded-t-xl border border-deli-grey px-[15px] py-5 [background:var(--deli-background-2)] transition-transform duration-300 ease-out ${
                  isProfileSheetVisible ? "translate-y-0" : "translate-y-full"
                }`}
              >
                {profileHeaderMenuConfig ? (
                  <div className="flex max-h-[65dvh] flex-col overflow-y-auto">
                    <ProfileSidebarContent
                      activeTab={profileHeaderMenuConfig.activeTab}
                      hasCampaigns={profileHeaderMenuConfig.hasCampaigns}
                      hasPatents={profileHeaderMenuConfig.hasPatents}
                      address={profileHeaderMenuConfig.address}
                      onRegisterIp={() => {
                        setIsMobileMenuOpen(false);
                        profileHeaderMenuConfig.onRegisterIp();
                      }}
                      onStartFunding={() => {
                        setIsMobileMenuOpen(false);
                        profileHeaderMenuConfig.onStartFunding();
                      }}
                      onExit={() => {
                        setIsMobileMenuOpen(false);
                        profileHeaderMenuConfig.onExit();
                      }}
                      onSelectTab={tab => {
                        setIsMobileMenuOpen(false);
                        profileHeaderMenuConfig.onSelectTab(tab);
                      }}
                    />
                  </div>
                ) : (
                  <ul className="menu p-0 w-full gap-8">
                    <HeaderMenuLinks mobile onLinkClick={() => setIsMobileMenuOpen(false)} />
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
