"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { DROPDOWN_ICON } from "~~/components/assets/common";
import {
  CAMPAIGN_NUMERAIRE_ADDRESSES,
  DEFAULT_NUMERAIRE_LOGO_URL,
  getNumeraireLogoUrl,
} from "~~/utils/numeraireImageMap";
import { DROPDOWN_SCROLL_MAX_HEIGHT_PX, DeliCustomScrollArea } from "~~/components/profile/DeliCustomScrollArea";
import type { NormalizedIpItem } from "~~/components/profile/types";
import { categoryIcons } from "~~/components/profile/utils";
import deployedContracts from "~~/contracts/deployedContracts";
import { useDeployedContractInfo, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { encodeCampaignParams } from "~~/utils/campaignParams";
import { DEFAULT_IP_STATUS, IP_STATUSES } from "~~/utils/ipStatusData";
import { JURISDICTIONS } from "~~/utils/jurisdictionData";
import {
  getOpenCorporatesFieldError,
  validateOpenCorporatesCompanyUrl,
} from "~~/utils/openCorporatesUrl";
import { findValidSalt } from "~~/utils/findValidSalt";
import { getUserFacingErrorMessage } from "~~/utils/userFacingError";

type DenominationUnit = "PER_ITEM" | "PER_HOUR" | "PER_DAY" | "PER_BYTE" | "PER_1000_TOKEN";

const DEFAULT_LICENSE_DURATION_SECONDS = 31_536_000; // 1 year
const DEFAULT_DENOMINATION_UNIT: DenominationUnit = "PER_ITEM";
const DEFAULT_DENOMINATION_AMOUNT = "1";
const DEFAULT_TRANSFERRABILITY_FLAG = "Transferrable" as const;

const STEP_TITLES = ["Campaign Setup", "Economics & Supply", "Funding Terms & Restrictions"] as const;

/** Matches CampaignManager LicenseType: 0 = Dynamic, 1 = Fixed */
const CAMPAIGN_TYPE_OPTIONS = [
  { value: "1" as const, label: "Fixed price" },
  { value: "0" as const, label: "Dynamic" },
] as const;

const fieldShell: CSSProperties = {
  border: "1px solid transparent",
  backgroundImage: "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-grey)",
  backgroundOrigin: "padding-box, border-box",
  backgroundClip: "padding-box, border-box",
};

const labelClass = "text-h6 text-deli-white";

const inputClass =
  "box-border h-11 w-full rounded-xl bg-deli-background px-3 py-2.5 text-body-2 text-deli-white outline-none placeholder:text-deli-grey-light";

const textareaClass =
  "box-border w-full min-h-[200px] rounded-xl bg-deli-background px-3 py-2.5 text-body-2 text-deli-white outline-none placeholder:text-deli-grey-light resize-none";

const rowGapClass = "gap-x-[60px] gap-y-4";

const fieldHintClass = "m-0 text-body-3 text-deli-grey-light";

const fieldErrorClass = "m-0 text-body-3 text-error";

const TOKEN_DECIMALS = 18;
const TOKEN_SCALE = 10n ** BigInt(TOKEN_DECIMALS);

/** totalSupplyWei = fundingTargetWei * 10^18 / pricePerTokenWei (both in 18-decimal currency units). */
const computeTotalSupplyWei = (fundingTarget: string, pricePerToken: string): bigint | null => {
  const targetTrimmed = fundingTarget.trim();
  const priceTrimmed = pricePerToken.trim();
  if (!targetTrimmed || !priceTrimmed) return null;

  try {
    const fundingTargetWei = parseUnits(targetTrimmed, TOKEN_DECIMALS);
    const priceWei = parseUnits(priceTrimmed, TOKEN_DECIMALS);
    if (priceWei === 0n) return null;
    const totalSupplyWei = (fundingTargetWei * TOKEN_SCALE) / priceWei;
    return totalSupplyWei > 0n ? totalSupplyWei : null;
  } catch {
    return null;
  }
};

const formatTotalSupply = (fundingTarget: string, pricePerToken: string): string | null => {
  const totalSupplyWei = computeTotalSupplyWei(fundingTarget, pricePerToken);
  if (totalSupplyWei === null) return null;
  return formatUnits(totalSupplyWei, TOKEN_DECIMALS);
};

const deliPickerShell = (open: boolean) => {
  const borderGradient = open ? "var(--deli-stroke-main)" : "var(--deli-stroke-grey)";
  return `linear-gradient(var(--deli-background),var(--deli-background)) padding-box, ${borderGradient} border-box`;
};

function FloatingPopoverList({
  anchorRef,
  open,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 280 });

  const sync = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 280),
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, sync]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const n = e.target as Node;
      if (anchorRef.current?.contains(n)) return;
      if (panelRef.current?.contains(n)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="overflow-hidden rounded-xl border border-transparent bg-deli-background shadow-lg"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 250,
        ...fieldShell,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function CombinedChevronField({
  open,
  onToggle,
  anchorRef,
  disabled,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  children: ReactNode;
}) {
  const shell = deliPickerShell(open);
  return (
    <div
      ref={anchorRef}
      className="overflow-hidden rounded-xl border border-transparent bg-deli-background transition-all duration-300"
      style={{ background: shell }}
    >
      <div className="flex min-h-11 items-center">
        <div className="flex min-h-11 min-w-0 flex-1 flex-wrap items-center gap-2 px-2">{children}</div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onToggle()}
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center self-center rounded-lg border border-transparent bg-deli-background text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: shell }}
          aria-expanded={open}
          aria-label={open ? "Close list" : "Open list"}
        >
          <span
            className="text-white [&_path]:fill-current transition-transform duration-300"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            {DROPDOWN_ICON}
          </span>
        </button>
      </div>
    </div>
  );
}

type CampaignFormState = {
  denominationUnit: DenominationUnit;
  denominationAmount: string;
  /** "0" = dynamic, "1" = fixed */
  campaignType: "0" | "1";
  patentTokenId: string;
  numeraireAddress: string;
  pricePerToken: string;
  fundingTarget: string;
  licenseDurationSeconds: string;
  territoryRestriction: string[];
  usageRightsDefinition: string;
  caseDescription: string;
  defendant: string;
  defendantOpenCorporatesPage: string;
  transferrabilityFlag: "Transferrable" | "NonTransferrable";
  status: string;
};

const initialForm = (): CampaignFormState => ({
  denominationUnit: DEFAULT_DENOMINATION_UNIT,
  denominationAmount: DEFAULT_DENOMINATION_AMOUNT,
  campaignType: "1",
  patentTokenId: "",
  numeraireAddress: "",
  pricePerToken: "",
  fundingTarget: "",
  licenseDurationSeconds: String(DEFAULT_LICENSE_DURATION_SECONDS),
  territoryRestriction: [],
  usageRightsDefinition: "",
  caseDescription: "",
  defendant: "",
  defendantOpenCorporatesPage: "",
  transferrabilityFlag: DEFAULT_TRANSFERRABILITY_FLAG,
  status: String(DEFAULT_IP_STATUS),
});

export type StartCampaignFormProps = {
  ipItems: NormalizedIpItem[];
  /** When set, patent field is pre-selected (patent card). When null, user must pick (sidebar). */
  initialPatentTokenId: number | null;
  onCancel: () => void;
  onSuccess: () => void;
};

export const StartCampaignForm = ({ ipItems, initialPatentTokenId, onCancel, onSuccess }: StartCampaignFormProps) => {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { writeContractAsync, isPending } = useScaffoldWriteContract("CampaignManager");
  const { data: campaignManagerContract } = useDeployedContractInfo({ contractName: "CampaignManager" });

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<CampaignFormState>(initialForm);
  const [openCorporatesUrlError, setOpenCorporatesUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPatentTokenId !== null) {
      setFormData(p => ({ ...p, patentTokenId: String(initialPatentTokenId) }));
    } else {
      setFormData(p => ({ ...p, patentTokenId: "" }));
    }
  }, [initialPatentTokenId]);

  const validateStep = useCallback(
    (s: number) => {
      if (s === 0) {
        if (!formData.patentTokenId.trim()) {
          toast.error("Please select a patent");
          return false;
        }
        return true;
      }
      if (s === 1) {
        if (!formData.numeraireAddress) {
          toast.error("Please select a currency");
          return false;
        }
        const price = parseFloat(formData.pricePerToken);
        if (!formData.pricePerToken.trim() || Number.isNaN(price) || price <= 0) {
          toast.error("Enter a positive price per token");
          return false;
        }
        const fundingTarget = parseFloat(formData.fundingTarget);
        if (!formData.fundingTarget.trim() || Number.isNaN(fundingTarget) || fundingTarget <= 0) {
          toast.error("Enter a positive funding target");
          return false;
        }
        if (computeTotalSupplyWei(formData.fundingTarget, formData.pricePerToken) === null) {
          toast.error("Funding target and price per token must yield a positive total supply");
          return false;
        }
        return true;
      }
      if (s === 2) {
        if (!formData.defendant.trim()) {
          toast.error("Please enter the defendant");
          return false;
        }
        const openCorporatesErr = getOpenCorporatesFieldError(formData.defendantOpenCorporatesPage, true);
        setOpenCorporatesUrlError(openCorporatesErr);
        if (openCorporatesErr) return false;
        if (!formData.caseDescription.trim()) {
          toast.error("Please enter the case description");
          return false;
        }
        if (!formData.usageRightsDefinition.trim()) {
          toast.error("Please enter the litigation finance agreement");
          return false;
        }
        return true;
      }
      return true;
    },
    [formData, setOpenCorporatesUrlError],
  );

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep(x => Math.min(x + 1, STEP_TITLES.length - 1));
  };

  const goBack = () => {
    if (step === 0) {
      onCancel();
      return;
    }
    setStep(x => x - 1);
  };

  const submitCampaign = useCallback(async () => {
    if (!validateStep(2)) return;
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    const patentId = BigInt(formData.patentTokenId);
    const licenseTypeNum: 0 | 1 = formData.campaignType === "0" ? 0 : 1;

    let currentStage: "campaign-upload" | "campaign-salt" | "campaign-init" = "campaign-upload";
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("denominationUnit", DEFAULT_DENOMINATION_UNIT);
      formDataToSend.append("denominationAmount", DEFAULT_DENOMINATION_AMOUNT);
      formDataToSend.append("licenseDuration", String(DEFAULT_LICENSE_DURATION_SECONDS));
      formDataToSend.append("usageRightsDefinition", formData.usageRightsDefinition);
      formDataToSend.append("caseDescription", formData.caseDescription);
      const openCorporatesValidation = validateOpenCorporatesCompanyUrl(formData.defendantOpenCorporatesPage);
      if (!openCorporatesValidation.valid) {
        setOpenCorporatesUrlError(openCorporatesValidation.error);
        return;
      }

      formDataToSend.append("defendant", formData.defendant);
      formDataToSend.append("defendantOpenCorporatesPage", openCorporatesValidation.normalized);
      formDataToSend.append("transferrabilityFlag", DEFAULT_TRANSFERRABILITY_FLAG);
      formDataToSend.append("chainId", String(targetNetwork.id));

      const validJurisdictions = JURISDICTIONS.map(j => j.jurisdiction);
      for (const t of formData.territoryRestriction) {
        if (!validJurisdictions.includes(t)) {
          toast.error(`Invalid territory selected: ${t}`);
          return;
        }
        formDataToSend.append("territoryRestriction", t);
      }

      currentStage = "campaign-upload";
      toast.loading("Uploading metadata...", { id: "campaign-upload" });
      const response = await fetch("/api/campaign", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload campaign metadata");
      }

      const metadataUri = result.uri;
      toast.success("Metadata uploaded successfully", { id: "campaign-upload" });

      currentStage = "campaign-salt";
      toast.loading("Finding valid salt...", { id: "campaign-salt" });

      if (!campaignManagerContract?.address) {
        throw new Error("CampaignManager contract address not found");
      }

      const chainId = targetNetwork.id;
      const chainContracts = (
        deployedContracts as Record<number, Record<string, { address: string; abi: readonly unknown[] }>>
      )[chainId];
      const patentErc721Contract = chainContracts?.IPERC721;
      if (!patentErc721Contract) {
        throw new Error("IPERC721 contract not found");
      }

      const licenseSalt = await findValidSalt(
        formData.numeraireAddress as `0x${string}`,
        metadataUri,
        patentId,
        licenseTypeNum,
        patentErc721Contract.address as `0x${string}`,
        campaignManagerContract.address as `0x${string}`,
        chainId,
      );

      toast.success("Valid salt found", { id: "campaign-salt" });

      const totalTokensWei = computeTotalSupplyWei(formData.fundingTarget, formData.pricePerToken);
      if (totalTokensWei === null) {
        throw new Error("Could not calculate total supply from funding target and price per token");
      }
      const priceWei = parseUnits(formData.pricePerToken, 18);
      const paramsBytes = encodeCampaignParams(licenseTypeNum, priceWei);

      currentStage = "campaign-init";
      toast.loading("Initializing campaign...", { id: "campaign-init" });

      await writeContractAsync({
        functionName: "initialize",
        args: [
          patentId,
          metadataUri,
          licenseSalt,
          formData.numeraireAddress as `0x${string}`,
          licenseTypeNum,
          totalTokensWei,
          {
            status: Number(formData.status),
            statusUpdateTimestamp: BigInt(Math.floor(Date.now() / 1000)),
            statusUpdateExplanation: "",
          },
          paramsBytes,
        ],
      });

      toast.success("Campaign initialized successfully!", { id: "campaign-init" });
      setFormData(initialForm());
      setOpenCorporatesUrlError(null);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      const message = getUserFacingErrorMessage(error, "Campaign setup failed. Please try again.");
      toast.error(message, { id: currentStage });
    }
  }, [address, campaignManagerContract?.address, formData, onSuccess, targetNetwork.id, validateStep, writeContractAsync]);

  const primaryAction = () => {
    if (step === STEP_TITLES.length - 1) {
      void submitCampaign();
    } else {
      goNext();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <h4 className="m-0 text-h4 text-deli-white">Start Funding Campaign</h4>
        <p className="m-0 text-body-3 text-deli-grey-light">{STEP_TITLES[step]}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DeliCustomScrollArea flexFill contentClassName="pr-1">
          {step === 0 ? (
            <StepCampaignSetup formData={formData} setFormData={setFormData} ipItems={ipItems} />
          ) : null}
          {step === 1 ? (
            <StepEconomics
              formData={formData}
              setFormData={setFormData}
              inputClass={inputClass}
              chainId={targetNetwork.id}
            />
          ) : null}
          {step === 2 ? (
            <StepLicenseTerms
              formData={formData}
              setFormData={setFormData}
              openCorporatesUrlError={openCorporatesUrlError}
              onDefendantOpenCorporatesPageChange={value => {
                setFormData(p => ({ ...p, defendantOpenCorporatesPage: value }));
                setOpenCorporatesUrlError(getOpenCorporatesFieldError(value, false));
              }}
            />
          ) : null}
        </DeliCustomScrollArea>
      </div>

      <footer className="mt-6 flex shrink-0 flex-col gap-4 pt-4">
        <div className="h-px w-full shrink-0" style={{ background: "var(--deli-stroke-grey)" }} />
        <div className="flex items-end justify-between gap-4">
          <p className="m-0 text-body-2 text-deli-grey-light">{`Step ${step + 1} of ${STEP_TITLES.length}`}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="cursor-pointer rounded-xl px-5 py-2.5 text-body-2 text-deli-white transition-colors hover:bg-deli-hover/40"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>
            {step === STEP_TITLES.length - 1 ? (
              <button
                type="button"
                onClick={primaryAction}
                disabled={isPending}
                className="cursor-pointer rounded-xl border border-transparent bg-deli-background px-5 py-2.5 text-body-2 text-deli-white disabled:opacity-50"
                style={{
                  ...fieldShell,
                  backgroundImage:
                    "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-main)",
                }}
              >
                {isPending ? "Processing…" : "Submit"}
              </button>
            ) : (
              <button
                type="button"
                onClick={primaryAction}
                disabled={isPending}
                className="cursor-pointer rounded-xl border border-transparent bg-deli-background px-5 py-2.5 text-body-2 text-deli-white transition-colors hover:bg-deli-hover/40 disabled:opacity-50"
                style={fieldShell}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

function StepCampaignSetup({
  formData,
  setFormData,
  ipItems,
}: {
  formData: CampaignFormState;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  ipItems: NormalizedIpItem[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <CampaignTypeAndPatentRow formData={formData} setFormData={setFormData} ipItems={ipItems} />
      <p className="m-0 text-body-3 text-deli-grey-light">
        Fixed price campaigns sell every DAO token at the same price. Dynamic campaigns raise the price as more tokens
        are sold.
      </p>
    </div>
  );
}

function CampaignTypeAndPatentRow({
  formData,
  setFormData,
  ipItems,
}: {
  formData: CampaignFormState;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  ipItems: NormalizedIpItem[];
}) {
  const [typeOpen, setTypeOpen] = useState(false);
  const typeAnchorRef = useRef<HTMLDivElement>(null);
  const selectedTypeLabel = CAMPAIGN_TYPE_OPTIONS.find(o => o.value === formData.campaignType)?.label ?? "";

  return (
    <div className={`flex flex-col items-start justify-start ${rowGapClass} lg:flex-row`}>
      <div className="flex w-full flex-1 flex-col gap-2 lg:min-w-[200px]">
        <span className={labelClass}>Campaign Type</span>
        <CombinedChevronField open={typeOpen} onToggle={() => setTypeOpen(o => !o)} anchorRef={typeAnchorRef}>
          <span className="text-body-2 text-deli-white">{selectedTypeLabel}</span>
        </CombinedChevronField>
        <FloatingPopoverList anchorRef={typeAnchorRef} open={typeOpen} onClose={() => setTypeOpen(false)}>
          <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
            {CAMPAIGN_TYPE_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  setFormData(p => ({ ...p, campaignType: o.value }));
                  setTypeOpen(false);
                }}
                className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
              >
                {o.label}
              </button>
            ))}
          </DeliCustomScrollArea>
        </FloatingPopoverList>
      </div>
      <div className="flex w-full flex-1 flex-col lg:min-w-[200px]">
        <PatentDeliSelect ipItems={ipItems} formData={formData} setFormData={setFormData} />
      </div>
    </div>
  );
}

function PatentDeliSelect({
  ipItems,
  formData,
  setFormData,
}: {
  ipItems: NormalizedIpItem[];
  formData: CampaignFormState;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormState>>;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => ipItems.find(i => String(i.tokenId) === formData.patentTokenId),
    [ipItems, formData.patentTokenId],
  );

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Patent</span>
      <CombinedChevronField
        open={open}
        onToggle={() => setOpen(o => !o)}
        anchorRef={anchorRef}
        disabled={ipItems.length === 0}
      >
        {!selected ? (
          <span className="text-body-2 text-deli-grey-light">
            {ipItems.length === 0 ? "No patents in wallet" : "Select patent…"}
          </span>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex shrink-0 items-center">{categoryIcons[selected.category]}</span>
            <span className="min-w-0 truncate text-body-2 text-deli-white">{selected.name}</span>
          </div>
        )}
      </CombinedChevronField>
      <FloatingPopoverList anchorRef={anchorRef} open={open && ipItems.length > 0} onClose={() => setOpen(false)}>
        <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
          {ipItems.map(item => (
            <button
              key={item.tokenId}
              type="button"
              onClick={() => {
                setFormData(p => ({ ...p, patentTokenId: String(item.tokenId) }));
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
            >
              <span className="flex shrink-0 items-center">{categoryIcons[item.category]}</span>
              <span className="min-w-0 truncate">{item.name}</span>
            </button>
          ))}
        </DeliCustomScrollArea>
      </FloatingPopoverList>
    </div>
  );
}

function StepEconomics({
  formData,
  setFormData,
  inputClass,
  chainId,
}: {
  formData: CampaignFormState;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  inputClass: string;
  chainId: number;
}) {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyAnchorRef = useRef<HTMLDivElement>(null);

  const numeraireContracts = useMemo(
    () =>
      CAMPAIGN_NUMERAIRE_ADDRESSES.map(address => ({
        chainId,
        address,
        abi: erc20Abi,
        functionName: "symbol" as const,
      })),
    [chainId],
  );

  const { data: symbolReadResults } = useReadContracts({
    contracts: numeraireContracts,
  });

  const symbolForAddress = useCallback(
    (addr: string) => {
      const i = CAMPAIGN_NUMERAIRE_ADDRESSES.findIndex(a => a.toLowerCase() === addr.trim().toLowerCase());
      if (i < 0 || !symbolReadResults?.[i]) return null;
      const r = symbolReadResults[i];
      if (r.status !== "success" || typeof r.result !== "string") return null;
      return r.result;
    },
    [symbolReadResults],
  );

  const selectedInList = useMemo(
    () => CAMPAIGN_NUMERAIRE_ADDRESSES.some(a => a.toLowerCase() === formData.numeraireAddress.trim().toLowerCase()),
    [formData.numeraireAddress],
  );

  const selectedSymbol =
    formData.numeraireAddress && selectedInList ? symbolForAddress(formData.numeraireAddress) : null;

  const totalSupplyDisplay = useMemo(
    () => formatTotalSupply(formData.fundingTarget, formData.pricePerToken),
    [formData.fundingTarget, formData.pricePerToken],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col justify-start ${rowGapClass} lg:flex-row`}>
        <div className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Currency</span>
          <CombinedChevronField
            open={currencyOpen}
            onToggle={() => setCurrencyOpen(o => !o)}
            anchorRef={currencyAnchorRef}
          >
            {!formData.numeraireAddress || !selectedInList ? (
              <span className="text-body-2 text-deli-grey-light">Select currency…</span>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getNumeraireLogoUrl(formData.numeraireAddress)}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                  onError={e => {
                    e.currentTarget.src = DEFAULT_NUMERAIRE_LOGO_URL;
                  }}
                />
                <span className="text-body-2 text-deli-white">{selectedSymbol ?? "…"}</span>
              </div>
            )}
          </CombinedChevronField>
          <FloatingPopoverList anchorRef={currencyAnchorRef} open={currencyOpen} onClose={() => setCurrencyOpen(false)}>
            <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
              {CAMPAIGN_NUMERAIRE_ADDRESSES.map(address => (
                <button
                  key={address}
                  type="button"
                  onClick={() => {
                    setFormData(p => ({ ...p, numeraireAddress: address }));
                    setCurrencyOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-deli-hover"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getNumeraireLogoUrl(address)}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                    onError={e => {
                      e.currentTarget.src = DEFAULT_NUMERAIRE_LOGO_URL;
                    }}
                  />
                  <span className="text-body-2 text-deli-white">{symbolForAddress(address) ?? "…"}</span>
                </button>
              ))}
            </DeliCustomScrollArea>
          </FloatingPopoverList>
        </div>

        <label className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Price Per Token</span>
          <input
            type="number"
            step="any"
            min={0}
            className={inputClass}
            style={fieldShell}
            placeholder="e.g. 1"
            value={formData.pricePerToken}
            onChange={e => setFormData(p => ({ ...p, pricePerToken: e.target.value }))}
          />
          <p className={fieldHintClass}>in currency</p>
        </label>
      </div>

      <label className="flex max-w-md flex-col gap-2">
        <span className={labelClass}>Funding Target</span>
        <input
          type="number"
          step="any"
          min={0}
          className={inputClass}
          style={fieldShell}
          placeholder="e.g. 10000"
          value={formData.fundingTarget}
          onChange={e => setFormData(p => ({ ...p, fundingTarget: e.target.value }))}
        />
        <p className={fieldHintClass}>in currency</p>
      </label>

      {totalSupplyDisplay ? (
        <p className="m-0 text-body-2 text-deli-grey-light">
          Total supply: <span className="text-deli-white">{totalSupplyDisplay}</span> tokens
        </p>
      ) : null}
    </div>
  );
}

function StepLicenseTerms({
  formData,
  setFormData,
  openCorporatesUrlError,
  onDefendantOpenCorporatesPageChange,
}: {
  formData: CampaignFormState;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  openCorporatesUrlError: string | null;
  onDefendantOpenCorporatesPageChange: (value: string) => void;
}) {
  const [territoryOpen, setTerritoryOpen] = useState(false);
  const territoryAnchorRef = useRef<HTMLDivElement>(null);

  const removeTerritory = (t: string) => {
    setFormData(p => ({ ...p, territoryRestriction: p.territoryRestriction.filter(x => x !== t) }));
  };

  const addTerritory = (t: string) => {
    setFormData(p => ({
      ...p,
      territoryRestriction: p.territoryRestriction.includes(t)
        ? p.territoryRestriction
        : [...p.territoryRestriction, t],
    }));
    setTerritoryOpen(false);
  };

  const availableTerritories = JURISDICTIONS.filter(j => !formData.territoryRestriction.includes(j.jurisdiction));

  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col justify-start ${rowGapClass} lg:flex-row`}>
        <label className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Defendant</span>
          <input
            type="text"
            className={inputClass}
            style={fieldShell}
            placeholder="Defendant name"
            value={formData.defendant}
            onChange={e => setFormData(p => ({ ...p, defendant: e.target.value }))}
          />
        </label>
        <label className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Defendant OpenCorporates Page</span>
          <input
            type="url"
            className={inputClass}
            style={fieldShell}
            placeholder="https://opencorporates.com/companies/..."
            value={formData.defendantOpenCorporatesPage}
            onChange={e => onDefendantOpenCorporatesPageChange(e.target.value)}
            aria-invalid={openCorporatesUrlError ? true : undefined}
            aria-describedby={openCorporatesUrlError ? "defendant-opencorporates-error" : undefined}
          />
          {openCorporatesUrlError ? (
            <p id="defendant-opencorporates-error" className={fieldErrorClass}>
              {openCorporatesUrlError}
            </p>
          ) : null}
        </label>
      </div>

      <div className="flex w-full flex-col gap-2 lg:max-w-md">
        <span className={labelClass}>Territory Restrictions</span>
          <CombinedChevronField
            open={territoryOpen}
            onToggle={() => setTerritoryOpen(o => !o)}
            anchorRef={territoryAnchorRef}
          >
            {formData.territoryRestriction.length === 0 ? (
              <span className="text-body-2 text-deli-grey-light">Add territory…</span>
            ) : (
              formData.territoryRestriction.map(t => (
                <div
                  key={t}
                  className="flex max-w-full items-center gap-2 rounded-lg px-2 py-1 text-body-2 text-deli-white"
                  style={fieldShell}
                >
                  <span className="min-w-0 max-w-[200px] truncate">{t}</span>
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer text-deli-grey-light hover:text-deli-white"
                    onClick={e => {
                      e.stopPropagation();
                      removeTerritory(t);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </CombinedChevronField>
          <FloatingPopoverList
            anchorRef={territoryAnchorRef}
            open={territoryOpen}
            onClose={() => setTerritoryOpen(false)}
          >
            <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
              {availableTerritories.map(j => (
                <button
                  key={j.jurisdiction}
                  type="button"
                  onClick={() => addTerritory(j.jurisdiction)}
                  className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
                >
                  {j.jurisdiction}
                </button>
              ))}
            </DeliCustomScrollArea>
          </FloatingPopoverList>
        <p className="m-0 text-body-3 text-deli-grey-light">Territories where the campaign is not active</p>
      </div>

      <div className="flex w-full flex-col gap-2 lg:max-w-md">
        <CaseStatusDeliSelect
          value={formData.status}
          onChange={status => setFormData(p => ({ ...p, status }))}
        />
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Case Description</span>
        <textarea
          className={textareaClass}
          style={fieldShell}
          placeholder="Describe the litigation case for funders"
          value={formData.caseDescription}
          onChange={e => setFormData(p => ({ ...p, caseDescription: e.target.value }))}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Litigation Finance Agreement</span>
        <textarea
          className={textareaClass}
          style={fieldShell}
          placeholder="Describe the litigation finance agreement for this campaign"
          value={formData.usageRightsDefinition}
          onChange={e => setFormData(p => ({ ...p, usageRightsDefinition: e.target.value }))}
        />
      </label>
    </div>
  );
}

function CaseStatusDeliSelect({ value, onChange }: { value: string; onChange: (status: string) => void }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selectedLabel = IP_STATUSES.find(item => String(item.value) === value)?.label ?? "Select status…";

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Case status</span>
      <CombinedChevronField open={open} onToggle={() => setOpen(o => !o)} anchorRef={anchorRef}>
        <span className="text-body-2 text-deli-white">{selectedLabel}</span>
      </CombinedChevronField>
      <FloatingPopoverList anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
          {IP_STATUSES.map(item => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                onChange(String(item.value));
                setOpen(false);
              }}
              className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
            >
              {item.label}
            </button>
          ))}
        </DeliCustomScrollArea>
      </FloatingPopoverList>
    </div>
  );
}
