import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { COPY_OWNER_ICON, DROPDOWN_ICON } from "~~/components/assets/common";
import { DROPDOWN_SCROLL_MAX_HEIGHT_PX, DeliCustomScrollArea } from "~~/components/profile/DeliCustomScrollArea";
import { formatCampaignDenominationForDisplay } from "~~/components/profile/utils";
import { isAttachmentProxyImageSrc, storageUriToProxiedImageUrl } from "~~/utils/storageMediaUrl";

export type CampaignItem = {
  licenseAddress: string;
  licenseSymbol: string;
  denomination: {
    unit: string;
    amount: number | string;
  };
  currentPrice?: number;
  totalSupply?: number;
  totalEmittedLicensesValueUSD?: number;
  totalTradingVolumeUSD?: number;
  growth24h?: number | null;
  retailPercent?: number | null;
};

export type PatentHeaderGeneralDataProps = {
  name: string;
  image: string;
  description: string;
  owner: string;
  campaigns: CampaignItem | CampaignItem[];
  onCampaignSelect?: (campaign: CampaignItem) => void;
  /** When false, hides license note and campaign dropdown; title stays below the image like the campaign layout. */
  showCampaignSelector?: boolean;
  isLoading?: boolean;
};

const PatentHeaderGeneralData = (data: PatentHeaderGeneralDataProps) => {
  const showCampaignSelector = data.showCampaignSelector !== false;
  const skeletonClassName = "animate-pulse rounded-md bg-deli-background";
  const truncatedOwner = data.owner.length > 8 ? `${data.owner.slice(0, 4)}...${data.owner.slice(-4)}` : data.owner;
  const resolvedImageSrc = storageUriToProxiedImageUrl(data.image);

  const handleCopyOwner = async () => {
    if (!data.owner) return;
    await navigator.clipboard.writeText(data.owner);
  };

  return (
    <div className="flex w-full max-w-[35rem] min-w-0 shrink-0 flex-col gap-6 xl:w-[35rem]">
      <div
        className={`grid w-full max-w-full gap-x-6 lg:gap-x-6 lg:gap-y-0 ${
          showCampaignSelector
            ? "grid-cols-[42px_minmax(0,1fr)] grid-rows-[auto_auto] gap-y-6 lg:grid-cols-[87px_minmax(0,1fr)] lg:grid-rows-[auto] lg:items-end"
            : "w-max max-w-full grid-cols-[42px] grid-rows-[auto] lg:grid-cols-[87px]"
        }`}
      >
        {data.isLoading ? (
          <div
            className={`${skeletonClassName} col-start-1 row-start-1 size-[42px] shrink-0 self-center justify-self-start rounded-full lg:size-[87px] ${showCampaignSelector ? "lg:self-end" : "lg:self-center"}`}
          />
        ) : resolvedImageSrc ? (
          <Image
            src={resolvedImageSrc}
            alt="Patent Image"
            width={87}
            height={87}
            unoptimized={isAttachmentProxyImageSrc(resolvedImageSrc)}
            className={`col-start-1 row-start-1 size-[42px] shrink-0 self-center justify-self-start rounded-full object-cover lg:size-[87px] ${showCampaignSelector ? "lg:self-end" : "lg:self-center"}`}
          />
        ) : (
          <div
            className={`col-start-1 row-start-1 size-[42px] shrink-0 self-center justify-self-start rounded-full bg-deli-background lg:size-[87px] ${showCampaignSelector ? "lg:self-end" : "lg:self-center"}`}
            aria-hidden
          />
        )}
        {showCampaignSelector ? (
          <div className="max-lg:contents lg:col-start-2 lg:row-start-1 lg:flex lg:h-[87px] lg:min-h-0 lg:min-w-0 lg:flex-col lg:justify-end lg:gap-2">
            {data.isLoading ? (
              <div
                className={`${skeletonClassName} col-start-2 row-start-1 h-4 w-full max-w-[min(100%,20rem)] self-center rounded-md lg:w-full lg:self-auto`}
              />
            ) : (
              <p className="text-deli-grey-light col-start-2 row-start-1 self-center text-body-2 leading-tight max-lg:min-w-0 lg:col-auto lg:row-auto lg:self-auto">
                *terms of use may vary depending on the license mode
              </p>
            )}
            <div className="col-span-2 row-start-2 w-full min-w-0 max-lg:w-full lg:col-span-1 lg:col-start-auto lg:row-start-auto">
              {data.isLoading ? (
                <div className={`${skeletonClassName} h-[48px] w-full rounded-xl`} />
              ) : (
                <CampaignDropdown campaigns={data.campaigns} onSelect={data.onCampaignSelect ?? (() => {})} />
              )}
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {data.isLoading ? (
          <div className={`${skeletonClassName} h-9 w-80 max-w-full`} />
        ) : (
          <h3 className="text-h3 text-deli-white">{data.name}</h3>
        )}
        <div className="flex flex-col gap-1">
          {data.isLoading ? (
            <>
              <div className={`${skeletonClassName} h-4 w-full max-w-[560px]`} />
              <div className={`${skeletonClassName} h-4 w-2/3 max-w-[420px]`} />
              <div className={`${skeletonClassName} mt-1 h-4 w-16`} />
            </>
          ) : (
            <>
              <p className="text-deli-grey-light text-body-2">
                {data.description.length > 120 ? `${data.description.slice(0, 120)}...` : data.description}
              </p>
              <a href="#description" className="text-deli-grey-light text-body-2 underline hover:no-underline w-fit">
                See more
              </a>
            </>
          )}
        </div>
      </div>
      <div className="inline-flex w-fit self-start items-center justify-between gap-3 rounded-xl border border-transparent bg-deli-main [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box] px-2 py-2.5">
        {data.isLoading ? (
          <div className={`${skeletonClassName} h-4 w-56`} />
        ) : (
          <>
            <p className="text-deli-grey-light text-body-2 m-0">Initial rights holder: {truncatedOwner}</p>
            <button
              type="button"
              onClick={handleCopyOwner}
              className="inline-flex items-center justify-center cursor-pointer"
              aria-label="Copy initial rights holder"
            >
              {COPY_OWNER_ICON}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const formatCampaignLabel = (campaign: CampaignItem) =>
  `License mode: ${formatCampaignDenominationForDisplay(campaign.denomination.amount, campaign.denomination.unit)}`;

const CampaignDropdown = ({
  campaigns,
  onSelect,
}: {
  campaigns: CampaignItem | CampaignItem[];
  onSelect: (campaign: CampaignItem) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const campaignList = Array.isArray(campaigns) ? campaigns : [campaigns];
  const hasMultiple = campaignList.length > 1;
  const [selected, setSelected] = useState<CampaignItem>(campaignList[0]);

  useEffect(() => {
    const nextSelected =
      campaignList.find(campaign => campaign.licenseAddress === selected.licenseAddress) ?? campaignList[0];
    if (nextSelected && nextSelected.licenseAddress !== selected.licenseAddress) {
      setSelected(nextSelected);
    }
  }, [campaigns, campaignList, selected.licenseAddress]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (campaign: CampaignItem) => {
    setSelected(campaign);
    setIsOpen(false);
    onSelect(campaign);
  };

  const borderGradient = isOpen ? "var(--deli-stroke-main)" : "var(--deli-stroke-grey)";
  const bgWithBorder = `linear-gradient(var(--deli-background),var(--deli-background)) padding-box, ${borderGradient} border-box`;
  const otherCampaigns = campaignList.filter(c => c.licenseAddress !== selected.licenseAddress);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderH(headerRef.current.offsetHeight);
    }
  }, [selected]);

  return (
    <div className="relative z-10" style={{ height: headerH }}>
      <div
        ref={containerRef}
        className="absolute inset-x-0 top-0 overflow-hidden rounded-xl border border-transparent bg-deli-background transition-all duration-300"
        style={{ background: bgWithBorder }}
      >
        <div ref={headerRef} className="flex min-h-11 items-center">
          <span className="flex min-h-11 min-w-0 flex-1 items-center gap-x-1 px-2 text-body-2">
            <span className="shrink-0 text-deli-grey-light">License mode:</span>
            <span className="min-w-0 text-deli-white">
              {formatCampaignDenominationForDisplay(selected.denomination.amount, selected.denomination.unit)}
            </span>
          </span>
          {hasMultiple && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center self-center rounded-lg border border-transparent bg-deli-background text-white transition-all duration-300"
              style={{ background: bgWithBorder }}
            >
              <span
                className="[&_path]:fill-current transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              >
                {DROPDOWN_ICON}
              </span>
            </button>
          )}
        </div>
        {hasMultiple && (
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden">
              <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
                <div className="mx-2 mb-0.5 mt-1 h-px" style={{ background: "var(--deli-stroke-grey)" }} />
                {otherCampaigns.map(campaign => (
                  <button
                    key={campaign.licenseAddress}
                    type="button"
                    onClick={() => handleSelect(campaign)}
                    className="w-full rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
                  >
                    {formatCampaignLabel(campaign)}
                  </button>
                ))}
              </DeliCustomScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatentHeaderGeneralData;
