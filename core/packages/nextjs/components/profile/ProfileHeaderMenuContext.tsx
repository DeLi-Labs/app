"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ProfileTab } from "~~/components/profile/types";

export type ProfileHeaderMenuConfig = {
  activeTab: ProfileTab;
  hasCampaigns: boolean;
  hasPatents: boolean;
  address?: string;
  onRegisterIp: () => void;
  onStartLicensing: () => void;
  onExit: () => void;
  onSelectTab: (tab: ProfileTab) => void;
};

type ProfileHeaderMenuContextValue = {
  config: ProfileHeaderMenuConfig | null;
  setConfig: (config: ProfileHeaderMenuConfig) => void;
  clearConfig: () => void;
};

const ProfileHeaderMenuContext = createContext<ProfileHeaderMenuContextValue | null>(null);

export const ProfileHeaderMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfigState] = useState<ProfileHeaderMenuConfig | null>(null);

  const setConfig = useCallback((nextConfig: ProfileHeaderMenuConfig) => {
    setConfigState(nextConfig);
  }, []);

  const clearConfig = useCallback(() => {
    setConfigState(null);
  }, []);

  const value = useMemo(
    () => ({
      config,
      setConfig,
      clearConfig,
    }),
    [config, setConfig, clearConfig],
  );

  return <ProfileHeaderMenuContext.Provider value={value}>{children}</ProfileHeaderMenuContext.Provider>;
};

export const useProfileHeaderMenuContext = () => {
  const ctx = useContext(ProfileHeaderMenuContext);
  if (!ctx) {
    throw new Error("useProfileHeaderMenuContext must be used within ProfileHeaderMenuProvider");
  }
  return ctx;
};
