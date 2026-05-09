"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CrumbsNavigation from "~~/components/CrumbsNavigation";
import { useCrumbsNavigation } from "~~/components/CrumbsNavigation";
import { DELI_LABS } from "~~/components/assets/common";
import PatentHeader, { PatentCategory, PatentHeaderProps } from "~~/components/patent/PatentHeader";
import SwapSection, { SwapSectionProps } from "~~/components/patent/SwapSection";
import { PatentTermsDetails, PatentTermsDetailsProps } from "~~/components/patent/Terms";
import { PATENT_CATEGORY_COLORS } from "~~/utils/patentCategoryColors";
import type { PatentDetail } from "~~/types";

const getPatentDetail = async (id: string, signal?: AbortSignal): Promise<PatentDetail> => {
  const response = await fetch(`/api/ip/${id}`, { signal });
  if (response.status === 404) {
    throw new Error("PATENT_NOT_FOUND");
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch patent detail for token ${id}`);
  }
  return response.json();
};

const mapToPatentHeaderProps = (
  patentDetail: PatentDetail,
  selectedCampaignAddress?: string,
  onCampaignSelect?: (campaignAddress: string) => void,
): PatentHeaderProps => {
  const statusLabelMap: Record<number, "valid" | "pending" | "invalid"> = {
    0: "valid",
    1: "pending",
    2: "invalid",
  };
  const selectedCampaign =
    patentDetail.campaigns.find(campaign => campaign.licenseAddress === selectedCampaignAddress) ??
    patentDetail.campaigns[0];

  return {
    category: patentDetail.categoryId as PatentCategory,
    patentHeaderGeneralData: {
      name: patentDetail.name,
      image: patentDetail.image,
      description: patentDetail.description,
      owner: patentDetail.owner,
      campaigns: patentDetail.campaigns.map(campaign => ({
        licenseAddress: campaign.licenseAddress,
        licenseSymbol: campaign.licenseSymbol,
        denomination: {
          unit: campaign.denominationUnit,
          amount: campaign.denominationAmount,
        },
        currentPrice: campaign.currentPrice,
        totalSupply: campaign.totalSupply,
        totalEmittedLicensesValueUSD: campaign.totalEmittedLicensesValueUSD,
        totalTradingVolumeUSD: campaign.totalTradingVolumeUSD,
        growth24h: campaign.growth24h,
        retailPercent: campaign.retailPercent,
      })),
      onCampaignSelect: campaign => onCampaignSelect?.(campaign.licenseAddress),
    },
    patentHeaderIndustries: {
      industries: patentDetail.industry,
    },
    patentHeaderMarketDataAndSocials: {
      websiteUrl: "link",
      telegramUrl: "link",
      instagramUrl: "link",
      XUrl: "link",
      patentStatus: patentDetail.status !== null ? statusLabelMap[patentDetail.status] : "pending",
      patentStatusUpdateTimestamp: patentDetail.statusUpdateTimestamp ?? undefined,
      tokenId: patentDetail.tokenId,
      totalLicensesValue: selectedCampaign?.totalEmittedLicensesValueUSD,
      currentPrice: selectedCampaign?.currentPrice,
      totalSupply: selectedCampaign?.totalSupply,
      totalTradingVolumeUSD: selectedCampaign?.totalTradingVolumeUSD,
      growth24h: selectedCampaign?.growth24h,
      retailPercent: selectedCampaign?.retailPercent,
    },
  };
};

const mapToSwapSectionProps = (patentDetail: PatentDetail, selectedCampaignAddress: string): SwapSectionProps => {
  const selectedCampaign =
    patentDetail.campaigns.find(campaign => campaign.licenseAddress === selectedCampaignAddress) ??
    patentDetail.campaigns[0];

  return {
    licenseAddress: selectedCampaign?.licenseAddress ?? "",
    categoryId: patentDetail.categoryId,
    hourlyPrices: selectedCampaign?.hourlyPrices ?? [],
    currentPrice: selectedCampaign?.currentPrice,
    image: patentDetail.image,
    licenseType: selectedCampaign?.licenseType ?? "FIXED",
    licenseSymbol: selectedCampaign?.licenseSymbol ?? "",
    numeraireAddress: selectedCampaign?.numeraireAddress ?? "",
    numeraireSymbol: selectedCampaign?.numeraireSymbol ?? "",
  };
};

const mapToPatentTermsDetailsProps = (
  patentDetail: PatentDetail,
  selectedCampaignAddress: string,
): PatentTermsDetailsProps => {
  return {
    category: patentDetail.categoryId as PatentCategory,
    description: patentDetail.description,
    territoryRestrictions: patentDetail.jurisdiction,
    usageRightsDefinition:
      patentDetail.campaigns.find(campaign => campaign.licenseAddress === selectedCampaignAddress)
        ?.usageRightsDefinition ??
      patentDetail.campaigns[0]?.usageRightsDefinition ??
      "",
    transferabilityFlags:
      patentDetail.campaigns.find(campaign => campaign.licenseAddress === selectedCampaignAddress)
        ?.transferabilityFlags ??
      patentDetail.campaigns[0]?.transferabilityFlags ??
      "Transferable",
    inventorNames: patentDetail.inventorNames,
    patentNumber: patentDetail.patentNumber,
    jurisdiction: patentDetail.jurisdiction,
    registrationAuthority: patentDetail.registrationAuthority,
    patentClassification: patentDetail.patentClassification,
    filingDate: patentDetail.filingDate,
    grantDate: patentDetail.grantDate,
    creationTimestamp: patentDetail.creationTimestamp,
    licenseDuration:
      patentDetail.campaigns.find(campaign => campaign.licenseAddress === selectedCampaignAddress)?.licenseDuration ??
      patentDetail.campaigns[0]?.licenseDuration ??
      "",
  };
};

const fallbackPatentDetail: PatentDetail = {
  tokenId: 0,
  name: "",
  image: "",
  description: "",
  industry: [],
  categoryId: "Technology",
  owner: "0x0000000000000000000000000000000000000000",
  inventorNames: "",
  status: null,
  statusUpdateTimestamp: null,
  statusUpdateExplanation: null,
  patentNumber: "",
  jurisdiction: [],
  registrationAuthority: "",
  filingDate: "",
  grantDate: "",
  patentClassification: "",
  creationTimestamp: "",
  campaigns: [
    {
      licenseAddress: "",
      licenseSymbol: "",
      numeraireAddress: "",
      numeraireSymbol: "",
      licenseType: "FIXED",
      usageRightsDefinition: "",
      transferabilityFlags: "Transferable",
      licenseDuration: "",
      denominationUnit: "",
      denominationAmount: 0,
      currentPrice: 0,
      totalSupply: 0,
      totalEmittedLicensesValueUSD: 0,
      totalTradingVolumeUSD: 0,
      growth24h: null,
      retailPercent: null,
      hourlyPrices: [],
    },
  ],
};

const PatentPage = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { setCrumbLabel } = useCrumbsNavigation();
  const [patentDetail, setPatentDetail] = useState<PatentDetail | null>(null);
  const [selectedCampaignAddress, setSelectedCampaignAddress] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPatentMissing, setIsPatentMissing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage(null);
    setIsPatentMissing(false);

    getPatentDetail(id, controller.signal)
      .then(detail => {
        if (controller.signal.aborted) return;
        setPatentDetail(detail);
        setSelectedCampaignAddress(detail.campaigns[0]?.licenseAddress);
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        if (error instanceof Error && error.message === "PATENT_NOT_FOUND") {
          setIsPatentMissing(true);
          setErrorMessage("We could not find a patent with this number. Please check and try again.");
          return;
        }
        setErrorMessage("Something went wrong while loading this page. Please try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const name = patentDetail?.name?.trim();
    if (!name) return;
    const href = `/patent/${id}`;
    setCrumbLabel(href, name);
  }, [id, patentDetail?.name, setCrumbLabel]);

  const safePatentDetail = patentDetail ?? fallbackPatentDetail;
  const activeCampaignAddress = selectedCampaignAddress ?? safePatentDetail.campaigns[0]?.licenseAddress ?? "";
  const deliLabsColor = PATENT_CATEGORY_COLORS[safePatentDetail.categoryId as PatentCategory].start;

  const isNoCampaignPatent = Boolean(!isLoading && patentDetail && patentDetail.campaigns.length === 0);
  const showCampaignSelector = isLoading || safePatentDetail.campaigns.length > 0;
  const patentHeaderProps = mapToPatentHeaderProps(safePatentDetail, activeCampaignAddress, setSelectedCampaignAddress);

  return (
    <div className="bg-deli-main overflow-x-hidden">
      <div className="flex grow flex-col px-[10px] pb-8 pt-10 lg:px-[75px]">
        <div className="flex w-full flex-col gap-4">
          <CrumbsNavigation labelMap={{ patent: "Patents" }} />
          <div className="flex flex-col lg:gap-15">
            {isPatentMissing && !isLoading ? (
              <div className="rounded-2xl border border-white/15 bg-white/5 px-6 py-8 text-center">
                <p className="font-urbanist text-[18px] leading-[140%] text-white md:text-[20px]">{errorMessage}</p>
              </div>
            ) : (
              <>
                {errorMessage && !isLoading ? (
                  <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-body-2 text-error">
                    {errorMessage}
                  </div>
                ) : null}
                <PatentHeader
                  {...patentHeaderProps}
                  patentHeaderGeneralData={{
                    ...patentHeaderProps.patentHeaderGeneralData,
                    showCampaignSelector,
                  }}
                  patentHeaderMarketDataAndSocials={{
                    ...patentHeaderProps.patentHeaderMarketDataAndSocials,
                    showUnmarketedPatentMessage: isNoCampaignPatent,
                  }}
                  isLoading={isLoading}
                />
                {!isNoCampaignPatent ? (
                  <SwapSection
                    {...mapToSwapSectionProps(safePatentDetail, activeCampaignAddress)}
                    isLoading={isLoading}
                    className="mt-[60px] lg:mt-0"
                  />
                ) : null}
                <PatentTermsDetails
                  {...mapToPatentTermsDetailsProps(safePatentDetail, activeCampaignAddress)}
                  hideUsageRightsSection={isNoCampaignPatent}
                  isLoading={isLoading}
                  className="mt-[60px] lg:mt-0"
                />
                <DELI_LABS color={deliLabsColor} className="mt-[50px] block h-auto w-full max-w-full lg:mt-0" />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-8 w-full px-[10px] pb-6 lg:px-[75px]">
        <div className="h-px w-full border-t-[2px] border-[#0F1314]" />
        <div className="mt-4 flex justify-end">
          <div className="flex flex-col gap-[5px] text-right">
            <span className="font-urbanist text-[12px] leading-[140%] font-light text-white md:text-[16px]">
              Designed by Tihon Belenkiy
            </span>
            <span className="font-urbanist text-[12px] leading-[140%] font-light text-white md:text-[16px]">
              @2026 DeLi labs. All rights reserved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatentPage;
