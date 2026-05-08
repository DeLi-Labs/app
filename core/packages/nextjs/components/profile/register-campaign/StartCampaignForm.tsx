"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { erc20Abi, parseUnits } from "viem";
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
import { JURISDICTIONS } from "~~/utils/jurisdictionData";
import { findValidSalt } from "~~/utils/findValidSalt";
import { getUserFacingErrorMessage } from "~~/utils/userFacingError";

type DenominationUnit = "PER_ITEM" | "PER_HOUR" | "PER_DAY" | "PER_BYTE" | "PER_1000_TOKEN";

const DENOMINATION_OPTIONS: { value: DenominationUnit; label: string }[] = [
  { value: "PER_ITEM", label: "Per Item" },
  { value: "PER_HOUR", label: "Per Hour" },
  { value: "PER_DAY", label: "Per Day" },
  { value: "PER_BYTE", label: "Per Byte" },
  { value: "PER_1000_TOKEN", label: "Per 1000 Token" },
];

const LICENSE_DURATION_OPTIONS = [
  { label: "1 year", seconds: 31_536_000 },
  { label: "2 years", seconds: 63_072_000 },
  { label: "5 years", seconds: 157_680_000 },
  { label: "10 years", seconds: 315_360_000 },
] as const;

const STEP_TITLES = ["Campaign Setup", "Economics & Supply", "License Terms & Restrictions"] as const;

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
  totalTokensToSell: string;
  licenseDurationSeconds: string;
  territoryRestriction: string[];
  usageRightsDefinition: string;
  transferrabilityFlag: "Transferrable" | "NonTransferrable";
};

const initialForm = (): CampaignFormState => ({
  denominationUnit: "PER_ITEM",
  denominationAmount: "",
  campaignType: "1",
  patentTokenId: "",
  numeraireAddress: "",
  pricePerToken: "",
  totalTokensToSell: "",
  licenseDurationSeconds: String(LICENSE_DURATION_OPTIONS[0].seconds),
  territoryRestriction: [],
  usageRightsDefinition: "",
  transferrabilityFlag: "Transferrable",
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
        const amt = parseFloat(formData.denominationAmount);
        if (!formData.denominationAmount.trim() || Number.isNaN(amt) || amt <= 0) {
          toast.error("Enter a positive price per licensing unit");
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
        if (!/^\d+$/.test(formData.totalTokensToSell.trim())) {
          toast.error("Total tokens to sell must be a positive whole number");
          return false;
        }
        const n = parseInt(formData.totalTokensToSell, 10);
        if (n <= 0) {
          toast.error("Total tokens to sell must be a positive whole number");
          return false;
        }
        return true;
      }
      if (s === 2) {
        if (!formData.licenseDurationSeconds) {
          toast.error("Please select license duration");
          return false;
        }
        if (!formData.usageRightsDefinition.trim()) {
          toast.error("Please enter usage rights definitions");
          return false;
        }
        return true;
      }
      return true;
    },
    [formData],
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
      formDataToSend.append("denominationUnit", formData.denominationUnit);
      formDataToSend.append("denominationAmount", formData.denominationAmount);
      formDataToSend.append("licenseDuration", formData.licenseDurationSeconds);
      formDataToSend.append("usageRightsDefinition", formData.usageRightsDefinition);
      formDataToSend.append("transferrabilityFlag", formData.transferrabilityFlag);
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

      const totalTokensWei = parseUnits(formData.totalTokensToSell, 18);
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
          paramsBytes,
        ],
      });

      toast.success("Campaign initialized successfully!", { id: "campaign-init" });
      setFormData(initialForm());
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
        <h4 className="m-0 text-h4 text-deli-white">Start Licensing Campaign</h4>
        <p className="m-0 text-body-3 text-deli-grey-light">{STEP_TITLES[step]}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DeliCustomScrollArea flexFill contentClassName="pr-1">
          {step === 0 ? (
            <StepCampaignSetup
              formData={formData}
              setFormData={setFormData}
              ipItems={ipItems}
              inputClass={inputClass}
            />
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
            <StepLicenseTerms formData={formData} setFormData={setFormData} inputClass={inputClass} />
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
  inputClass,
}: {
  formData: CampaignFormState;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  ipItems: NormalizedIpItem[];
  inputClass: string;
}) {
  const [unitOpen, setUnitOpen] = useState(false);
  const unitAnchorRef = useRef<HTMLDivElement>(null);
  const selectedUnitLabel = DENOMINATION_OPTIONS.find(o => o.value === formData.denominationUnit)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col justify-start ${rowGapClass} lg:flex-row`}>
        <div className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Licensing Unit</span>
          <CombinedChevronField open={unitOpen} onToggle={() => setUnitOpen(o => !o)} anchorRef={unitAnchorRef}>
            <span className="text-body-2 text-deli-white">{selectedUnitLabel}</span>
          </CombinedChevronField>
          <FloatingPopoverList anchorRef={unitAnchorRef} open={unitOpen} onClose={() => setUnitOpen(false)}>
            <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
              {DENOMINATION_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setFormData(p => ({ ...p, denominationUnit: o.value }));
                    setUnitOpen(false);
                  }}
                  className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
                >
                  {o.label}
                </button>
              ))}
            </DeliCustomScrollArea>
          </FloatingPopoverList>
        </div>
        <label className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Price Per Unit In Token</span>
          <input
            type="number"
            step="any"
            min={0}
            className={inputClass}
            style={fieldShell}
            placeholder="e.g. 1.5"
            value={formData.denominationAmount}
            onChange={e => setFormData(p => ({ ...p, denominationAmount: e.target.value }))}
          />
        </label>
      </div>
      <CampaignTypeAndPatentRow formData={formData} setFormData={setFormData} ipItems={ipItems} />
      <p className="m-0 text-body-3 text-deli-grey-light">
        Fixed price campaigns sell every license at the same price. Dynamic campaigns raise the price as more licenses
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
  const [transferOpen, setTransferOpen] = useState(false);
  const transferAnchorRef = useRef<HTMLDivElement>(null);

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

  const transferOptions = ["Transferrable", "NonTransferrable"] as const;

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
        </label>
      </div>

      <label className="flex max-w-md flex-col gap-2">
        <span className={labelClass}>Total Tokens To Sell</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={inputClass}
          style={fieldShell}
          placeholder="Whole number"
          value={formData.totalTokensToSell}
          onChange={e => setFormData(p => ({ ...p, totalTokensToSell: e.target.value.replace(/\D/g, "") }))}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Transferability</span>
        <CombinedChevronField
          open={transferOpen}
          onToggle={() => setTransferOpen(o => !o)}
          anchorRef={transferAnchorRef}
        >
          <span className="text-body-2 text-deli-white">{formData.transferrabilityFlag}</span>
        </CombinedChevronField>
        <FloatingPopoverList anchorRef={transferAnchorRef} open={transferOpen} onClose={() => setTransferOpen(false)}>
          <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
            {transferOptions.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setFormData(p => ({ ...p, transferrabilityFlag: opt }));
                  setTransferOpen(false);
                }}
                className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
              >
                {opt}
              </button>
            ))}
          </DeliCustomScrollArea>
        </FloatingPopoverList>
        <p className="m-0 text-body-3 text-deli-grey-light">
          Select whether the license tokens are legally allowed to be transferred or not
        </p>
      </div>
    </div>
  );
}

function StepLicenseTerms({
  formData,
  setFormData,
  inputClass,
}: {
  formData: CampaignFormState;
  setFormData: React.Dispatch<React.SetStateAction<CampaignFormState>>;
  inputClass: string;
}) {
  const [durationOpen, setDurationOpen] = useState(false);
  const durationAnchorRef = useRef<HTMLDivElement>(null);
  const [territoryOpen, setTerritoryOpen] = useState(false);
  const territoryAnchorRef = useRef<HTMLDivElement>(null);

  const durationLabel =
    LICENSE_DURATION_OPTIONS.find(o => String(o.seconds) === formData.licenseDurationSeconds)?.label ?? "";

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
      <div className={`flex flex-col items-start justify-start ${rowGapClass} lg:flex-row`}>
        <div className="flex w-full flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>License Duration</span>
          <CombinedChevronField
            open={durationOpen}
            onToggle={() => setDurationOpen(o => !o)}
            anchorRef={durationAnchorRef}
          >
            <span className="text-body-2 text-deli-white">{durationLabel || "Select duration…"}</span>
          </CombinedChevronField>
          <FloatingPopoverList anchorRef={durationAnchorRef} open={durationOpen} onClose={() => setDurationOpen(false)}>
            <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
              {LICENSE_DURATION_OPTIONS.map(o => (
                <button
                  key={o.seconds}
                  type="button"
                  onClick={() => {
                    setFormData(p => ({ ...p, licenseDurationSeconds: String(o.seconds) }));
                    setDurationOpen(false);
                  }}
                  className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
                >
                  {o.label}
                </button>
              ))}
            </DeliCustomScrollArea>
          </FloatingPopoverList>
        </div>

        <div className="flex w-full flex-1 flex-col gap-2 lg:min-w-[200px]">
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
          <p className="m-0 text-body-3 text-deli-grey-light italic">Territories where the campaign is not active</p>
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Usage Rights Definitions</span>
        <textarea
          className={textareaClass}
          style={fieldShell}
          placeholder="Describe usage rights for this license campaign"
          value={formData.usageRightsDefinition}
          onChange={e => setFormData(p => ({ ...p, usageRightsDefinition: e.target.value }))}
        />
      </label>
    </div>
  );
}
