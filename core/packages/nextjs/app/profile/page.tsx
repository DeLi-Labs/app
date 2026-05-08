"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

    const id = window.setTimeout(() => {
      router.replace("/registration");
    }, DISCONNECTED_REDIRECT_MS);

    return () => window.clearTimeout(id);
  }, [status, router]);

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

  const handleRequestStartLicensing = useCallback((patentTokenId: number | null) => {
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

  const handleExit = useCallback(() => {
    disconnect();
    router.push("/registration");
  }, [disconnect, router]);

  const handleSelectTab = useCallback((tab: ProfileTab) => {
    setRegisterIpOpen(false);
    setStartCampaignOpen(false);
    setStartCampaignPatentTokenId(null);
    setActiveTab(tab);
  }, []);

  const handleStartLicensing = useCallback(() => {
    handleRequestStartLicensing(null);
  }, [handleRequestStartLicensing]);

  useEffect(() => {
    setProfileHeaderMenuConfig({
      activeTab,
      hasCampaigns,
      hasPatents: normalizedIps.length > 0,
      address,
      onRegisterIp: handleRegisterIp,
      onStartLicensing: handleStartLicensing,
      onExit: handleExit,
      onSelectTab: handleSelectTab,
    });
  }, [
    activeTab,
    hasCampaigns,
    normalizedIps.length,
    address,
    handleRegisterIp,
    handleStartLicensing,
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
    <main className="flex min-h-screen flex-col bg-deli-main px-[10px] pb-8 pt-10 lg:p-[75px]">
      <div className="flex min-h-0 flex-1 gap-8">
        <ProfileSidebar
          activeTab={activeTab}
          hasCampaigns={hasCampaigns}
          hasPatents={normalizedIps.length > 0}
          address={address}
          onRegisterIp={handleRegisterIp}
          onStartLicensing={handleStartLicensing}
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
          onRequestStartLicensing={handleRequestStartLicensing}
        />
      </div>
    </main>
  );
}
