import type { ReactNode } from "react";
import { PLUS_ICON } from "~~/components/assets/common";
import { ProfileSidebarMintButtons } from "~~/components/profile/ProfileSidebarMintButtons";
import type { ProfileTab } from "~~/components/profile/types";
import { tabIcons, truncateMiddleAddress } from "~~/components/profile/utils";

export type ProfileSidebarContentProps = {
  activeTab: ProfileTab;
  hasCampaigns: boolean;
  hasPatents: boolean;
  address?: string;
  onRegisterIp: () => void;
  onStartLicensing: () => void;
  onExit: () => void;
  onSelectTab: (tab: ProfileTab) => void;
};

const separator = <div className="h-px w-full [background:var(--deli-stroke-grey)]" />;

type TabButtonProps = {
  isActive: boolean;
  icon: ReactNode;
  title: string;
  onClick: () => void;
};

const TabButton = ({ isActive, icon, title, onClick }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full min-w-0 cursor-pointer items-center gap-4 rounded-xl px-3 py-2 text-left transition-colors"
    style={{
      background: isActive ? "var(--deli-background)" : "transparent",
    }}
  >
    <span className="shrink-0">{icon}</span>
    <span className="min-w-0 break-words text-body-2 text-deli-white">{title}</span>
  </button>
);

export const ProfileSidebarContent = ({
  activeTab,
  hasCampaigns,
  hasPatents,
  address,
  onRegisterIp,
  onStartLicensing,
  onExit,
  onSelectTab,
}: ProfileSidebarContentProps) => {
  return (
    <>
      <h4 className="m-0 text-h4 text-deli-white">My Account</h4>

      <div className="mt-7 w-full">
        <ProfileSidebarMintButtons />
      </div>

      <div className="h-8" />
      {separator}
      <div className="h-8" />

      <button
        type="button"
        onClick={onRegisterIp}
        className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-transparent px-3 py-3 text-body-2 text-deli-white"
        style={{
          backgroundImage: "var(--deli-background-2), var(--deli-stroke-grey)",
          backgroundOrigin: "padding-box, border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        <span>Register IP</span>
        <span>{PLUS_ICON}</span>
      </button>

      {hasPatents ? (
        <>
          <div className="h-4" />
          <button
            type="button"
            onClick={onStartLicensing}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-transparent px-3 py-3 text-body-2 text-deli-white"
            style={{
              backgroundImage: "var(--deli-background-2), var(--deli-stroke-grey)",
              backgroundOrigin: "padding-box, border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            <span>Start Licensing</span>
            <span>{PLUS_ICON}</span>
          </button>
        </>
      ) : null}

      <div className="h-8" />
      {separator}
      <div className="h-8" />

      <div className="flex flex-col gap-2">
        <TabButton
          isActive={activeTab === "ips"}
          icon={tabIcons.ips}
          title="My IP NFTs"
          onClick={() => onSelectTab("ips")}
        />
        {hasCampaigns && (
          <TabButton
            isActive={activeTab === "campaigns"}
            icon={tabIcons.campaigns}
            title="My Licensing Campaigns"
            onClick={() => onSelectTab("campaigns")}
          />
        )}
      </div>

      <div className="mt-auto">
        {separator}
        <div className="h-7" />
        <div className="flex items-center justify-between gap-4">
          <p className="m-0 text-body-2 text-deli-grey">{truncateMiddleAddress(address, 4, 4)}</p>
          <button type="button" className="cursor-pointer text-body-2 text-deli-white" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>
    </>
  );
};
