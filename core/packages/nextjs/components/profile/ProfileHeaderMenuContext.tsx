"use client";

import React, { createContext, useContext } from "react";

type ProfileHeaderTab = string;

type ProfileHeaderMenuConfig = {
  activeTab: ProfileHeaderTab;
  hasCampaigns: boolean;
  hasPatents: boolean;
  address?: string;
  onRegisterIp: () => void;
  onStartLicensing: () => void;
  onExit: () => void;
  onSelectTab: (tab: ProfileHeaderTab) => void;
};

type ProfileHeaderMenuContextValue = {
  config: ProfileHeaderMenuConfig | null;
};

const ProfileHeaderMenuContext = createContext<ProfileHeaderMenuContextValue>({
  config: null,
});

export const useProfileHeaderMenuContext = () => useContext(ProfileHeaderMenuContext);

export const ProfileHeaderMenuProvider = ({
  children,
  config = null,
}: {
  children: React.ReactNode;
  config?: ProfileHeaderMenuConfig | null;
}) => {
  return <ProfileHeaderMenuContext.Provider value={{ config }}>{children}</ProfileHeaderMenuContext.Provider>;
};
