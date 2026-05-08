"use client";

import React from "react";

export const ProfileSidebarContent = ({
  activeTab,
  hasCampaigns,
  hasPatents,
  address,
  onRegisterIp,
  onStartLicensing,
  onExit,
  onSelectTab,
}: {
  activeTab: string;
  hasCampaigns: boolean;
  hasPatents: boolean;
  address?: string;
  onRegisterIp: () => void;
  onStartLicensing: () => void;
  onExit: () => void;
  onSelectTab: (tab: string) => void;
}) => {
  return (
    <div className="text-deli-white p-4">
      <div className="text-sm opacity-70 mb-3">Profile menu placeholder</div>
      <div className="text-xs opacity-60 mb-4">
        tab: {activeTab} | campaigns: {String(hasCampaigns)} | patents: {String(hasPatents)} | address: {address ?? "-"}
      </div>
      <div className="flex flex-col gap-2">
        <button className="btn btn-sm" onClick={() => onSelectTab(activeTab)}>
          Select Current Tab
        </button>
        <button className="btn btn-sm" onClick={onRegisterIp}>
          Register IP
        </button>
        <button className="btn btn-sm" onClick={onStartLicensing}>
          Start Licensing
        </button>
        <button className="btn btn-sm" onClick={onExit}>
          Exit
        </button>
      </div>
    </div>
  );
};
