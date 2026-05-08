"use client";

import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { zeroAddress } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { ATTACHMENTS_ICON, DROPDOWN_ICON } from "~~/components/assets/common";
import { PATENT_CATEGORY_COLORS, type PatentCategory } from "~~/utils/patentCategoryColors";
import {
  DROPDOWN_SCROLL_MAX_HEIGHT_PX,
  DeliCustomScrollArea,
  type DeliCustomScrollAreaHandle,
} from "~~/components/profile/DeliCustomScrollArea";
import { DeliDatePicker } from "~~/components/profile/register-ip/DeliDatePicker";
import { categoryIcons, safeCategory } from "~~/components/profile/utils";
import deployedContracts from "~~/contracts/deployedContracts";
import { useDeployedContractInfo, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { INDUSTRIES } from "~~/utils/industryData";
import { JURISDICTIONS } from "~~/utils/jurisdictionData";
import { getUserFacingErrorMessage } from "~~/utils/userFacingError";

type AttachmentType = "ENCRYPTED" | "PLAIN";

type AttachmentRow = {
  name: string;
  type: AttachmentType;
  description: string;
  fileType: string;
  fileSizeBytes: number;
  file: File;
};

type IpFormState = {
  name: string;
  description: string;
  image: File | null;
  attachments: AttachmentRow[];
  patentNumber: string;
  inventorNames: string;
  jurisdiction: string[];
  registrationAuthority: string;
  patentClassification: string;
  filingDate: string;
  grantDate: string;
  status: string;
  statusUpdateExplanation: string;
  reasonCode: string;
  caseReference: string;
  industry: string[];
};

const initialForm = (): IpFormState => ({
  name: "",
  description: "",
  patentNumber: "",
  inventorNames: "",
  jurisdiction: [],
  registrationAuthority: "",
  patentClassification: "",
  filingDate: "",
  grantDate: "",
  status: "0",
  statusUpdateExplanation: "",
  reasonCode: "0",
  caseReference: "",
  industry: [],
  image: null,
  attachments: [],
});

const fieldShell: CSSProperties = {
  border: "1px solid transparent",
  backgroundImage: "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-grey)",
  backgroundOrigin: "padding-box, border-box",
  backgroundClip: "padding-box, border-box",
};

const STEP_TITLES = ["General Information", "Legal & Registry Data", "Timeline", "Attachments"] as const;

const labelClass = "text-h6 text-deli-white";

const inputClass =
  "box-border h-11 w-full rounded-xl bg-deli-background px-3 py-2.5 text-body-2 text-deli-white outline-none placeholder:text-deli-grey-light";

const textareaClass =
  "box-border w-full min-h-[200px] rounded-xl bg-deli-background px-3 py-2.5 text-body-2 text-deli-white outline-none placeholder:text-deli-grey-light resize-none";

const shortTextareaClass =
  "box-border w-full min-h-[88px] rounded-xl bg-deli-background px-3 py-2.5 text-body-2 text-deli-white outline-none placeholder:text-deli-grey-light resize-none";

const rowGap15Class = "gap-x-[60px] gap-y-4";

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

type RegisterIpFormProps = {
  onCancel: () => void;
  onSuccess: () => void;
};

export const RegisterIpForm = ({ onCancel, onSuccess }: RegisterIpFormProps) => {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const { data: campaignManagerContract } = useDeployedContractInfo({ contractName: "CampaignManager" });
  const { writeContractAsync: writeIpErc721, isPending: isIpErc721Pending } = useScaffoldWriteContract("IPERC721");

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<IpFormState>(initialForm);

  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<{
    file: File | null;
    description: string;
    type: AttachmentType;
    name: string;
  }>({
    file: null,
    description: "",
    type: "PLAIN",
    name: "",
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateStep = useCallback(
    (s: number) => {
      if (s === 0) {
        if (!formData.name.trim()) {
          toast.error("Please enter a name");
          return false;
        }
        if (formData.industry.length === 0) {
          toast.error("Please select at least one industry");
          return false;
        }
        if (!formData.description.trim()) {
          toast.error("Please enter a description");
          return false;
        }
        if (!formData.image) {
          toast.error("Please select an image");
          return false;
        }
      }
      if (s === 1) {
        if (!formData.patentNumber.trim()) {
          toast.error("Please enter a patent number");
          return false;
        }
        if (!formData.inventorNames.trim()) {
          toast.error("Please enter inventor names");
          return false;
        }
        if (formData.jurisdiction.length === 0) {
          toast.error("Please add at least one jurisdiction");
          return false;
        }
        if (!formData.registrationAuthority) {
          toast.error("Please select a registration authority");
          return false;
        }
        if (!formData.patentClassification.trim()) {
          toast.error("Please enter patent classification");
          return false;
        }
      }
      if (s === 2) {
        if (!formData.filingDate) {
          toast.error("Please select a filing date");
          return false;
        }
        if (!formData.grantDate) {
          toast.error("Please select a grant date");
          return false;
        }
      }
      return true;
    },
    [formData],
  );

  const goNext = () => {
    if (!validateStep(step)) return;
    if (step < STEP_TITLES.length - 1) {
      setStep(step + 1);
    }
  };

  const goBack = () => {
    if (step === 0) {
      onCancel();
      return;
    }
    setStep(step - 1);
  };

  const openAttachmentModal = (file?: File) => {
    setCurrentAttachment({
      file: file ?? null,
      description: "",
      type: "PLAIN",
      name: file?.name ?? "",
    });
    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = "";
    }
    setAttachmentModalOpen(true);
  };

  const closeAttachmentModal = () => {
    setAttachmentModalOpen(false);
    setCurrentAttachment({
      file: null,
      description: "",
      type: "PLAIN",
      name: "",
    });
    if (attachmentFileInputRef.current) {
      attachmentFileInputRef.current.value = "";
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const handleAttachmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentAttachment(prev => ({
        ...prev,
        file,
        name: prev.name || file.name,
      }));
    }
  };

  const handleAddAttachment = () => {
    if (!currentAttachment.file) {
      toast.error("Please select a file");
      return;
    }

    const attachment: AttachmentRow = {
      name: currentAttachment.name,
      type: currentAttachment.type,
      description: currentAttachment.description,
      fileType: currentAttachment.file.type || "application/octet-stream",
      fileSizeBytes: currentAttachment.file.size,
      file: currentAttachment.file,
    };

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, attachment],
    }));
    closeAttachmentModal();
  };

  const handleRemoveAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      openAttachmentModal(f);
    }
  };

  const submitRegistration = useCallback(async () => {
    for (let s = 0; s <= 2; s++) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!formData.image) {
      toast.error("Please select an image");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("patentNumber", formData.patentNumber);
    formDataToSend.append("inventorNames", formData.inventorNames);
    formData.jurisdiction.forEach(j => formDataToSend.append("jurisdiction", j));
    formDataToSend.append("registrationAuthority", formData.registrationAuthority);
    formDataToSend.append("patentClassification", formData.patentClassification);
    formDataToSend.append("filingDate", formData.filingDate);
    formDataToSend.append("grantDate", formData.grantDate);
    if (formData.status) formDataToSend.append("status", formData.status);
    formDataToSend.append("statusUpdateTimestamp", String(Math.floor(Date.now() / 1000)));
    if (formData.statusUpdateExplanation) {
      formDataToSend.append("statusUpdateExplanation", formData.statusUpdateExplanation);
    }
    if (formData.reasonCode) formDataToSend.append("reasonCode", formData.reasonCode);
    if (formData.caseReference) formDataToSend.append("caseReference", formData.caseReference);
    if (formData.industry.length === 0) {
      toast.error("Please select at least one industry");
      return;
    }
    formData.industry.forEach(i => formDataToSend.append("industry", i));
    formDataToSend.append("image", formData.image);

    type ProcessedAttachment = { file: File; name: string; description: string; type: AttachmentType };
    let processedAttachments: ProcessedAttachment[];

    const encryptedCount = formData.attachments.filter(a => a.type === "ENCRYPTED").length;
    if (encryptedCount > 0) {
      try {
        toast.loading(`Encrypting ${encryptedCount} attachment(s) with Lit Protocol...`, { id: "encrypt" });
        const cipherGateway = {} as any;
        processedAttachments = await Promise.all(
          formData.attachments.map(async (attachment): Promise<ProcessedAttachment> => {
            if (attachment.type === "ENCRYPTED") {
              const result = await cipherGateway.encrypt(attachment.file, {
                metadata: { fileType: attachment.fileType },
              });
              const serialized = result.ciphertext.serialize();
              const blob = new Blob([new Uint8Array(serialized)], {
                type: "application/octet-stream",
              });
              const file = new File([blob], `${attachment.name}.encrypted`, {
                type: "application/octet-stream",
              });
              return { file, name: attachment.name, description: attachment.description, type: attachment.type };
            }
            return {
              file: attachment.file,
              name: attachment.name,
              description: attachment.description,
              type: attachment.type,
            };
          }),
        );
        toast.success("Encryption complete", { id: "encrypt" });
      } catch (error) {
        console.error("Error encrypting attachments:", error);
        toast.error(getUserFacingErrorMessage(error, "Failed to encrypt attachments"), { id: "encrypt" });
        return;
      }
    } else {
      processedAttachments = formData.attachments.map(a => ({
        file: a.file,
        name: a.name,
        description: a.description,
        type: a.type,
      }));
    }

    processedAttachments.forEach((attachment, index) => {
      formDataToSend.append(`attachments[${index}]`, attachment.file);
      formDataToSend.append(`attachments[${index}].name`, attachment.name);
      formDataToSend.append(`attachments[${index}].description`, attachment.description);
      formDataToSend.append(`attachments[${index}].type`, attachment.type);
    });

    let currentStage: "upload" | "mint" | "stake" = "upload";
    try {
      toast.loading("Uploading...", { id: "upload" });
      const response = await fetch("/api/ip", {
        method: "POST",
        body: formDataToSend,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload IP metadata");
      }
      const metadataUri = result.uri as string;
      toast.success("Metadata uploaded", { id: "upload" });

      if (!campaignManagerContract?.address) {
        throw new Error("CampaignManager contract address not found");
      }

      if (!publicClient) {
        throw new Error("Could not get public client");
      }

      const chainId = targetNetwork.id;
      const chainContracts = (
        deployedContracts as Record<number, Record<string, { address: string; abi: readonly unknown[] }>>
      )[chainId];
      const ipErc721Contract = chainContracts?.IPERC721;
      if (!ipErc721Contract) {
        throw new Error("IPERC721 contract not found");
      }

      currentStage = "mint";
      toast.loading("Minting IP NFT...", { id: "mint" });
      const nextTokenId = await publicClient.readContract({
        address: ipErc721Contract.address as `0x${string}`,
        abi: ipErc721Contract.abi,
        functionName: "_nextTokenId",
      });

      const mintHash = await writeIpErc721({
        functionName: "mint",
        args: [metadataUri, zeroAddress as `0x${string}`, 0n],
      });

      if (!mintHash) {
        throw new Error("Mint transaction failed");
      }

      await publicClient.waitForTransactionReceipt({ hash: mintHash });
      const tokenId = nextTokenId as bigint;
      toast.success(`IP NFT minted (token ID ${tokenId})`, { id: "mint" });

      currentStage = "stake";
      toast.loading("Staking NFT to campaign manager...", { id: "stake" });
      const transferHash = await writeIpErc721({
        functionName: "safeTransferFrom",
        args: [address, campaignManagerContract.address, tokenId],
      } as Parameters<typeof writeIpErc721>[0]);
      if (!transferHash) {
        throw new Error("Stake transaction failed");
      }
      await publicClient.waitForTransactionReceipt({ hash: transferHash });

      toast.success("IP NFT staked to campaign manager", { id: "stake" });

      setFormData(initialForm());
      setStep(0);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      const message = getUserFacingErrorMessage(error, "IP registration failed. Please try again.");
      toast.error(message, { id: currentStage });
    }
  }, [address, campaignManagerContract?.address, formData, onSuccess, publicClient, targetNetwork.id, validateStep, writeIpErc721]);

  const primaryAction = () => {
    if (step === STEP_TITLES.length - 1) {
      void submitRegistration();
    } else {
      goNext();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="mb-6 flex shrink-0 items-start justify-between gap-4">
        <h4 className="m-0 text-h4 text-deli-white">Register Intellectual Property</h4>
        <p className="m-0 text-body-3 text-deli-grey-light">{STEP_TITLES[step]}</p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DeliCustomScrollArea flexFill contentClassName="pr-1">
          {step === 0 ? (
            <StepGeneral
              formData={formData}
              setFormData={setFormData}
              imageInputRef={imageInputRef}
              onImageChange={handleImageChange}
              inputClass={inputClass}
            />
          ) : null}
          {step === 1 ? <StepLegal formData={formData} setFormData={setFormData} inputClass={inputClass} /> : null}
          {step === 2 ? (
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
              <DeliDatePicker
                label="Filing Date"
                value={formData.filingDate}
                onChange={v => setFormData(p => ({ ...p, filingDate: v }))}
                required
              />
              <DeliDatePicker
                label="Grant Date"
                value={formData.grantDate}
                onChange={v => setFormData(p => ({ ...p, grantDate: v }))}
                required
              />
            </div>
          ) : null}
          {step === 3 ? (
            <StepAttachments
              formData={formData}
              dropZoneRef={dropZoneRef}
              onDropZoneDragOver={handleDropZoneDragOver}
              onDropZoneDrop={handleDropZoneDrop}
              onOpenModal={() => openAttachmentModal()}
              onRemove={handleRemoveAttachment}
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
              Back
            </button>
            {step === STEP_TITLES.length - 1 ? (
              <button
                type="button"
                onClick={primaryAction}
                disabled={isIpErc721Pending}
                className="cursor-pointer rounded-xl border border-transparent bg-deli-background px-5 py-2.5 text-body-2 text-deli-white disabled:opacity-50"
                style={{
                  ...fieldShell,
                  backgroundImage:
                    "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-main)",
                }}
              >
                {isIpErc721Pending ? "Processing…" : "Submit"}
              </button>
            ) : (
              <button
                type="button"
                onClick={primaryAction}
                disabled={isIpErc721Pending}
                className="cursor-pointer rounded-xl border border-transparent bg-deli-background px-5 py-2.5 text-body-2 text-deli-white transition-colors hover:bg-deli-hover/40 disabled:opacity-50"
                style={fieldShell}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </footer>

      {attachmentModalOpen ? (
        <AttachmentModal
          currentAttachment={currentAttachment}
          setCurrentAttachment={setCurrentAttachment}
          attachmentFileInputRef={attachmentFileInputRef}
          onFileChange={handleAttachmentFileChange}
          onClose={closeAttachmentModal}
          onAdd={handleAddAttachment}
        />
      ) : null}
    </div>
  );
};

function StepGeneral({
  formData,
  setFormData,
  imageInputRef,
  onImageChange,
  inputClass,
}: {
  formData: IpFormState;
  setFormData: React.Dispatch<React.SetStateAction<IpFormState>>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputClass: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col justify-start ${rowGap15Class} lg:flex-row`}>
        <label className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Name</span>
          <input
            type="text"
            className={inputClass}
            style={fieldShell}
            placeholder="Name of the IP which will be displayed in the UI"
            value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          />
        </label>
        <div className="flex flex-1 flex-col gap-2 lg:min-w-[280px]">
          <IndustryDeliSelect
            selected={formData.industry}
            onChange={next => setFormData(p => ({ ...p, industry: next }))}
          />
        </div>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>Description</span>
        <textarea
          className={textareaClass}
          style={fieldShell}
          placeholder="Describe the technology and IP"
          value={formData.description}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Image</span>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="box-border w-full max-w-md cursor-pointer rounded-xl px-3 py-3 text-left text-body-2 text-deli-white"
          style={fieldShell}
        >
          {formData.image ? (
            <span className="text-deli-white">{formData.image.name}</span>
          ) : (
            <span className="text-deli-grey-light">No files selected</span>
          )}
        </button>
      </div>
    </div>
  );
}

function industryIconForName(name: string) {
  const row = INDUSTRIES.find(i => i.industry === name);
  const cat: PatentCategory = row ? safeCategory(row.parentCategory) : "Technology";
  return categoryIcons[cat];
}

const INDUSTRY_CATEGORY_ORDER: PatentCategory[] = [
  "Medicine",
  "Engineering",
  "Technology",
  "Energy",
  "Resources",
  "Creative",
];

function IndustryDeliSelect({ selected, onChange }: { selected: string[]; onChange: (industries: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const industryScrollRef = useRef<DeliCustomScrollAreaHandle>(null);
  const sectionRefs = useRef<Partial<Record<PatentCategory, HTMLDivElement | null>>>({});

  const remove = (ind: string) => {
    onChange(selected.filter(x => x !== ind));
  };

  const add = (ind: string) => {
    if (!selected.includes(ind)) {
      onChange([...selected, ind]);
    }
    setOpen(false);
  };

  const available = useMemo(() => INDUSTRIES.filter(({ industry }) => !selected.includes(industry)), [selected]);

  const availableByCategory = useMemo(() => {
    type IndustryRow = (typeof INDUSTRIES)[number];
    const map = new Map<PatentCategory, IndustryRow[]>();
    for (const row of available) {
      const cat: PatentCategory = safeCategory(row.parentCategory);
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(row);
    }
    return INDUSTRY_CATEGORY_ORDER.filter(c => (map.get(c)?.length ?? 0) > 0).map(category => ({
      category,
      items: map.get(category)!,
    }));
  }, [available]);

  const [activeCategory, setActiveCategory] = useState<PatentCategory>("Technology");

  useLayoutEffect(() => {
    if (!open) return;
    const first = availableByCategory[0]?.category;
    if (first) setActiveCategory(first);
  }, [open, availableByCategory]);

  const updateActiveFromScroll = useCallback(() => {
    const sc = industryScrollRef.current?.getScrollElement();
    if (!sc || availableByCategory.length === 0) return;
    const threshold = sc.scrollTop + 28;
    let next = availableByCategory[0].category;
    for (const { category } of availableByCategory) {
      const el = sectionRefs.current[category];
      if (!el) continue;
      const sectionTop = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
      if (sectionTop <= threshold) next = category;
    }
    setActiveCategory(c => (c === next ? c : next));
  }, [availableByCategory]);

  const industryThumbColor = PATENT_CATEGORY_COLORS[activeCategory].start;

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Industry</span>
      <CombinedChevronField open={open} onToggle={() => setOpen(o => !o)} anchorRef={anchorRef}>
        {selected.length === 0 ? (
          <span className="text-body-2 text-deli-grey-light">Add industry…</span>
        ) : (
          selected.map(ind => (
            <div
              key={ind}
              className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-body-2 text-deli-white"
              style={fieldShell}
            >
              <span className="flex shrink-0 items-center">{industryIconForName(ind)}</span>
              <span className="min-w-0">{ind}</span>
              <button
                type="button"
                className="ml-0.5 cursor-pointer text-deli-grey-light hover:text-deli-white"
                onClick={e => {
                  e.stopPropagation();
                  remove(ind);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </CombinedChevronField>
      <FloatingPopoverList anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <DeliCustomScrollArea
          ref={industryScrollRef}
          maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}
          railPaddingYPx={8}
          thumbStyle={{ background: industryThumbColor }}
          onScroll={updateActiveFromScroll}
        >
          <div className="flex flex-col py-1">
            {availableByCategory.map(({ category, items }) => {
              const icon = categoryIcons[category];
              return (
                <div
                  key={category}
                  ref={el => {
                    sectionRefs.current[category] = el;
                  }}
                  className="flex flex-col"
                >
                  <div className="flex items-center gap-2 px-2 py-2 text-body-2 text-deli-white" role="presentation">
                    <span className="flex shrink-0 items-center">{icon}</span>
                    <span className="min-w-0 font-medium">{category}</span>
                  </div>
                  {items.map(({ industry }) => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => add(industry)}
                      className="w-full cursor-pointer rounded-lg py-2.5 pl-11.5 pr-2 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </DeliCustomScrollArea>
      </FloatingPopoverList>
    </div>
  );
}

function JurisdictionDeliSelect({
  selected,
  onJurisdictionsChange,
}: {
  selected: string[];
  onJurisdictionsChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const remove = (j: string) => {
    onJurisdictionsChange(selected.filter(x => x !== j));
  };

  const add = (jurisdiction: string) => {
    if (!selected.includes(jurisdiction)) {
      onJurisdictionsChange([...selected, jurisdiction]);
    }
    setOpen(false);
  };

  const available = JURISDICTIONS.filter(j => !selected.includes(j.jurisdiction));

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Jurisdiction</span>
      <CombinedChevronField open={open} onToggle={() => setOpen(o => !o)} anchorRef={anchorRef}>
        {selected.length === 0 ? (
          <span className="text-body-2 text-deli-grey-light">Add jurisdiction…</span>
        ) : (
          selected.map(j => (
            <div
              key={j}
              className="flex max-w-full items-center gap-2 rounded-lg px-2 py-1 text-body-2 text-deli-white"
              style={fieldShell}
            >
              <span className="min-w-0 max-w-[220px] truncate">{j}</span>
              <button
                type="button"
                className="shrink-0 cursor-pointer text-deli-grey-light hover:text-deli-white"
                onClick={e => {
                  e.stopPropagation();
                  remove(j);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </CombinedChevronField>
      <FloatingPopoverList anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
          {available.map(j => (
            <button
              key={j.jurisdiction}
              type="button"
              onClick={() => add(j.jurisdiction)}
              className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
            >
              <span className="min-w-0">{j.jurisdiction}</span>
            </button>
          ))}
        </DeliCustomScrollArea>
      </FloatingPopoverList>
    </div>
  );
}

function RegistrationAuthorityDeliSelect({
  jurisdictions,
  value,
  onChange,
}: {
  jurisdictions: string[];
  value: string;
  onChange: (registrationAuthority: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const disabled = jurisdictions.length === 0;

  const options = useMemo(() => JURISDICTIONS.filter(j => jurisdictions.includes(j.jurisdiction)), [jurisdictions]);

  const displayLabel = useMemo(() => {
    if (!value) return null;
    const match = options.find(o => o.registrationAuthority === value);
    return match ? `${match.registrationAuthority} (${match.jurisdiction})` : value;
  }, [value, options]);

  useEffect(() => {
    if (jurisdictions.length === 0) {
      setOpen(false);
    }
  }, [jurisdictions.length]);

  return (
    <div className="flex flex-col gap-2">
      <span className={labelClass}>Registration Authority</span>
      <CombinedChevronField
        open={open && !disabled}
        onToggle={() => {
          if (!disabled) {
            setOpen(o => !o);
          }
        }}
        disabled={disabled}
        anchorRef={anchorRef}
      >
        {displayLabel ? (
          <span className="min-w-0 truncate text-body-2 text-deli-white">{displayLabel}</span>
        ) : (
          <span className="min-w-0 truncate text-body-2 text-deli-grey-light">
            {disabled ? "Select jurisdiction first" : "Select registration authority…"}
          </span>
        )}
      </CombinedChevronField>
      <FloatingPopoverList anchorRef={anchorRef} open={open && !disabled} onClose={() => setOpen(false)}>
        <DeliCustomScrollArea maxHeightPx={DROPDOWN_SCROLL_MAX_HEIGHT_PX}>
          {options.map(j => (
            <button
              key={`${j.jurisdiction}-${j.registrationAuthority}`}
              type="button"
              onClick={() => {
                onChange(j.registrationAuthority);
                setOpen(false);
              }}
              className="w-full cursor-pointer rounded-lg px-2 py-2.5 text-left text-body-2 text-deli-white transition-colors hover:bg-deli-hover"
            >
              <span className="min-w-0">{`${j.registrationAuthority} (${j.jurisdiction})`}</span>
            </button>
          ))}
        </DeliCustomScrollArea>
      </FloatingPopoverList>
    </div>
  );
}

function StepLegal({
  formData,
  setFormData,
  inputClass,
}: {
  formData: IpFormState;
  setFormData: React.Dispatch<React.SetStateAction<IpFormState>>;
  inputClass: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className={`flex flex-col justify-start ${rowGap15Class} lg:flex-row`}>
        <label className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Patent Number</span>
          <input
            type="text"
            className={inputClass}
            style={fieldShell}
            placeholder="Number which patent is registered in official registry"
            value={formData.patentNumber}
            onChange={e => setFormData(p => ({ ...p, patentNumber: e.target.value }))}
          />
        </label>
        <label className="flex flex-1 flex-col gap-2 lg:min-w-[200px]">
          <span className={labelClass}>Inventor Names</span>
          <input
            type="text"
            className={inputClass}
            style={fieldShell}
            placeholder="Inventor names"
            value={formData.inventorNames}
            onChange={e => setFormData(p => ({ ...p, inventorNames: e.target.value }))}
          />
        </label>
      </div>

      <div className={`flex flex-col justify-start items-start ${rowGap15Class} lg:flex-row`}>
        <div className="flex w-full flex-1 flex-col lg:min-w-[280px]">
          <JurisdictionDeliSelect
            selected={formData.jurisdiction}
            onJurisdictionsChange={next =>
              setFormData(prev => {
                const validAuthorities = JURISDICTIONS.filter(item => next.includes(item.jurisdiction)).map(
                  item => item.registrationAuthority,
                );
                const newRegAuth = validAuthorities.includes(prev.registrationAuthority)
                  ? prev.registrationAuthority
                  : "";
                return {
                  ...prev,
                  jurisdiction: next,
                  registrationAuthority: newRegAuth,
                };
              })
            }
          />
        </div>
        <div className="flex w-full flex-1 flex-col lg:min-w-[280px]">
          <RegistrationAuthorityDeliSelect
            jurisdictions={formData.jurisdiction}
            value={formData.registrationAuthority}
            onChange={authority => setFormData(p => ({ ...p, registrationAuthority: authority }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Patent Classification</span>
          <input
            type="text"
            className={inputClass}
            style={fieldShell}
            placeholder="Classification (e.g. IPC, CPC codes)"
            value={formData.patentClassification}
            onChange={e => setFormData(p => ({ ...p, patentClassification: e.target.value }))}
          />
        </label>
        <p className="m-0 text-body-2 text-deli-grey">
          Official patent classification codes, for example: IPC, CPC codes.
        </p>
      </div>
    </div>
  );
}

function StepAttachments({
  formData,
  dropZoneRef,
  onDropZoneDragOver,
  onDropZoneDrop,
  onOpenModal,
  onRemove,
}: {
  formData: IpFormState;
  dropZoneRef: React.RefObject<HTMLDivElement | null>;
  onDropZoneDragOver: (e: React.DragEvent) => void;
  onDropZoneDrop: (e: React.DragEvent) => void;
  onOpenModal: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="flex h-full min-h-[400px] flex-col gap-6">
      <span className={labelClass}>Attachments</span>
      <div
        ref={dropZoneRef}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenModal();
          }
        }}
        onClick={onOpenModal}
        onDragOver={onDropZoneDragOver}
        onDrop={onDropZoneDrop}
        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-transparent px-6 py-12 text-center"
        style={{
          ...fieldShell,
          backgroundImage: "linear-gradient(var(--deli-main), var(--deli-main)), var(--deli-stroke-grey)",
        }}
      >
        <span className="flex items-center justify-center">{ATTACHMENTS_ICON}</span>
        <p className="m-0 max-w-md text-body-2 text-deli-grey-light">
          Add attachments (PDF patent documents, drawings, 3D models, legal opinions, etc.)
        </p>
      </div>

      {formData.attachments.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {formData.attachments.map((a, index) => (
            <li
              key={`${a.name}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl px-3 py-2"
              style={fieldShell}
            >
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-body-2 text-deli-white">{a.name}</p>
                <p className="m-0 text-body-3 text-deli-grey-light">{a.description || "—"}</p>
                <p className="m-0 text-body-3 text-deli-grey">{a.type}</p>
              </div>
              <button
                type="button"
                className="shrink-0 text-deli-grey-light hover:text-deli-white cursor-pointer"
                onClick={() => onRemove(index)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AttachmentModal({
  currentAttachment,
  setCurrentAttachment,
  attachmentFileInputRef,
  onFileChange,
  onClose,
  onAdd,
}: {
  currentAttachment: { file: File | null; description: string; type: AttachmentType; name: string };
  setCurrentAttachment: React.Dispatch<
    React.SetStateAction<{ file: File | null; description: string; type: AttachmentType; name: string }>
  >;
  attachmentFileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-deli-main/70 backdrop-blur-md cursor-default"
        aria-label="Close modal backdrop"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-xl border border-transparent bg-deli-background p-6 shadow-xl"
        style={fieldShell}
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-body-2 text-deli-grey-light hover:text-deli-white cursor-pointer"
        >
          ✕
        </button>
        <h3 className="m-0 mb-4 text-h6 text-deli-white">Add Attachment</h3>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className={labelClass}>File</span>
            <input ref={attachmentFileInputRef} type="file" className="hidden" onChange={onFileChange} />
            <button
              type="button"
              onClick={() => attachmentFileInputRef.current?.click()}
              className={`${inputClass} w-full cursor-pointer text-left`}
              style={fieldShell}
            >
              {currentAttachment.file ? (
                <span className="text-deli-white">{currentAttachment.file.name}</span>
              ) : (
                <span className="text-deli-grey-light">Choose file…</span>
              )}
            </button>
          </div>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Name</span>
            <input
              type="text"
              className={inputClass}
              style={fieldShell}
              placeholder="Name of the attachment"
              value={currentAttachment.name}
              onChange={e => setCurrentAttachment(p => ({ ...p, name: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Description</span>
            <textarea
              className={shortTextareaClass}
              style={fieldShell}
              placeholder="Description of the attachment"
              value={currentAttachment.description}
              onChange={e => setCurrentAttachment(p => ({ ...p, description: e.target.value }))}
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Type</span>
            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-body-2 text-deli-white">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm rounded border-deli-grey"
                  checked={currentAttachment.type === "PLAIN"}
                  onChange={() => setCurrentAttachment(p => ({ ...p, type: "PLAIN" }))}
                />
                Plain
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-body-2 text-deli-white">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm rounded border-deli-grey"
                  checked={currentAttachment.type === "ENCRYPTED"}
                  onChange={() => setCurrentAttachment(p => ({ ...p, type: "ENCRYPTED" }))}
                />
                Encrypted
              </label>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-body-2 text-deli-grey-light cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAdd}
              className="rounded-xl border border-transparent px-4 py-2 text-body-2 text-deli-white cursor-pointer"
              style={{
                ...fieldShell,
                backgroundImage:
                  "linear-gradient(var(--deli-background), var(--deli-background)), var(--deli-stroke-main)",
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
