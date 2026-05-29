"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useAccountEffect, useDisconnect } from "wagmi";
import { ProfileContent } from "~~/components/profile/ProfileContent";
import { useProfileHeaderMenuContext } from "~~/components/profile/ProfileHeaderMenuContext";
import { ProfileSidebar } from "~~/components/profile/ProfileSidebar";
import type { ProfileTab } from "~~/components/profile/types";
import { flattenCampaigns, normalizeOwnerItems } from "~~/components/profile/utils";
import type { OwnerIPWithCampaigns } from "~~/types";

/** Debounce so a brief `disconnected` before reconnect does not bounce to /registration. */
const DISCONNECTED_REDIRECT_MS = 200;

export default function ProfilePage() {
  const router = useRouter();
  const { logout, authenticated: privyAuthenticated } = usePrivy();
  const privyAuthenticatedRef = useRef(privyAuthenticated);
  privyAuthenticatedRef.current = privyAuthenticated;
  const { address, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [activeTab, setActiveTab] = useState<ProfileTab>("ips");
  const [registerIpOpen, setRegisterIpOpen] = useState(false);
  const [startCampaignOpen, setStartCampaignOpen] = useState(false);
  const [startCampaignPatentTokenId, setStartCampaignPatentTokenId] = useState<number | null>(null);
  const [items, setItems] = useState<OwnerIPWithCampaigns[]>([]);
  const refetchAfterSubmissionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setConfig: setProfileHeaderMenuConfig, clearConfig: clearProfileHeaderMenuConfig } =
    useProfileHeaderMenuContext();

  useAccountEffect({
    onDisconnect() {
      if (privyAuthenticatedRef.current) return;
      router.replace("/registration");
    },
  });

  useEffect(() => {
    if (status === "reconnecting" || status === "connecting") {
      return;
    }
    if (status !== "disconnected") {
      return;
    }
    if (privyAuthenticated) {
      return;
    }

    const id = window.setTimeout(() => {
      router.replace("/registration");
    }, DISCONNECTED_REDIRECT_MS);

    return () => window.clearTimeout(id);
  }, [status, privyAuthenticated, router]);

  const loadOwnerItems = useCallback(async () => {
    if (!address) {
      setItems([]);
      return;
    }

    try {
      const response = await fetch(`/api/ip/owner/${address}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch profile data");
      const payload = (await response.json()) as OwnerIPWithCampaigns[];
      setItems(payload ?? []);
    } catch (error) {
      console.error("Failed to load profile items:", error);
      setItems([]);
    }
  }, [address]);

  useEffect(() => {
    void loadOwnerItems();
  }, [loadOwnerItems]);

  useEffect(() => {
    return () => {
      if (refetchAfterSubmissionTimeoutRef.current !== null) {
        clearTimeout(refetchAfterSubmissionTimeoutRef.current);
        refetchAfterSubmissionTimeoutRef.current = null;
      }
    };
  }, []);

  const refetchAfterSubmission = useCallback(() => {
    void loadOwnerItems();
    if (refetchAfterSubmissionTimeoutRef.current !== null) {
      clearTimeout(refetchAfterSubmissionTimeoutRef.current);
    }
    refetchAfterSubmissionTimeoutRef.current = setTimeout(() => {
      refetchAfterSubmissionTimeoutRef.current = null;
      void loadOwnerItems();
    }, 2500);
  }, [loadOwnerItems]);

  const normalizedIps = useMemo(() => normalizeOwnerItems(items), [items]);
  const campaigns = useMemo(() => flattenCampaigns(normalizedIps), [normalizedIps]);
  const hasCampaigns = campaigns.length > 0;

  useEffect(() => {
    if (!hasCampaigns && activeTab === "campaigns") {
      setActiveTab("ips");
    }
  }, [activeTab, hasCampaigns]);

  const handleRegisterIp = useCallback(() => {
    setStartCampaignOpen(false);
    setActiveTab("ips");
    setRegisterIpOpen(true);
  }, []);

  const handleCloseRegisterIp = () => {
    setRegisterIpOpen(false);
  };

  const handleRegisterIpSuccess = () => {
    setRegisterIpOpen(false);
    setActiveTab("ips");
    refetchAfterSubmission();
  };

  const handleRequestStartFunding = useCallback((patentTokenId: number | null) => {
    setRegisterIpOpen(false);
    setActiveTab("ips");
    setStartCampaignPatentTokenId(patentTokenId);
    setStartCampaignOpen(true);
  }, []);

  const handleCloseStartCampaign = () => {
    setStartCampaignOpen(false);
    setStartCampaignPatentTokenId(null);
  };

  const handleStartCampaignSuccess = () => {
    setStartCampaignOpen(false);
    setStartCampaignPatentTokenId(null);
    refetchAfterSubmission();
  };

  const handleExit = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout from Privy:", error);
    } finally {
      disconnect();
      window.location.assign("/registration");
    }
  }, [disconnect, logout]);

  const handleSelectTab = useCallback((tab: ProfileTab) => {
    setRegisterIpOpen(false);
    setStartCampaignOpen(false);
    setStartCampaignPatentTokenId(null);
    setActiveTab(tab);
  }, []);

  const handleStartFunding = useCallback(() => {
    handleRequestStartFunding(null);
  }, [handleRequestStartFunding]);

  useEffect(() => {
    setProfileHeaderMenuConfig({
      activeTab,
      hasCampaigns,
      hasPatents: normalizedIps.length > 0,
      address,
      onRegisterIp: handleRegisterIp,
      onStartFunding: handleStartFunding,
      onExit: handleExit,
      onSelectTab: handleSelectTab,
    });
  }, [
    activeTab,
    hasCampaigns,
    normalizedIps.length,
    address,
    handleRegisterIp,
    handleStartFunding,
    handleExit,
    handleSelectTab,
    setProfileHeaderMenuConfig,
  ]);

  useEffect(() => {
    return () => {
      clearProfileHeaderMenuConfig();
    };
  }, [clearProfileHeaderMenuConfig]);

  return (
    <main className="flex min-h-screen flex-col bg-deli-main pb-8 pt-20 lg:pb-[75px]">
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 gap-8 px-5 lg:px-[75px] lg:pt-[75px]">
        <ProfileSidebar
          activeTab={activeTab}
          hasCampaigns={hasCampaigns}
          hasPatents={normalizedIps.length > 0}
          address={address}
          onRegisterIp={handleRegisterIp}
          onStartFunding={handleStartFunding}
          onExit={handleExit}
          onSelectTab={handleSelectTab}
        />
        <ProfileContent
          activeTab={activeTab}
          ipItems={normalizedIps}
          campaigns={campaigns}
          registerIpOpen={registerIpOpen}
          startCampaignOpen={startCampaignOpen}
          startCampaignPatentTokenId={startCampaignPatentTokenId}
          onRegisterIp={handleRegisterIp}
          onCloseRegisterIp={handleCloseRegisterIp}
          onRegisterIpSuccess={handleRegisterIpSuccess}
          onCloseStartCampaign={handleCloseStartCampaign}
          onStartCampaignSuccess={handleStartCampaignSuccess}
          onRequestStartFunding={handleRequestStartFunding}
        />
      </div>
    </main>
  );
}
