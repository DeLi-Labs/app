"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import toast from "react-hot-toast";
import { formatUnits, parseUnits, type Address } from "viem";
import { useAccount, usePublicClient, useReadContract, useSignTypedData, useWalletClient } from "wagmi";
import { PlusIcon, WalletIcon } from "@heroicons/react/24/outline";
import { arrowsSwapSvg } from "~~/components/assets/common";
import { getNumeraireLogoUrl } from "~~/utils/numeraireImageMap";
import { CAMPAIGN_DISPLAY_TOKEN } from "~~/components/profile/utils";
import deployedContracts from "~~/contracts/deployedContracts";
import externalContracts from "~~/contracts/externalContracts";
import { useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import type { CampaignLicenseType, PermitMessage } from "~~/types";
import { normalizePermitMessageForWallet } from "~~/utils/normalizePermitMessage";
import { getUserFacingErrorMessage } from "~~/utils/userFacingError";
import { isAttachmentProxyImageSrc, storageUriToProxiedImageUrl } from "~~/utils/storageMediaUrl";

type CampaignSwapperProps = {
  licenseAddress: string;
  licenseSymbol: string;
  licenseType: CampaignLicenseType;
  numeraireAddress: string;
  numeraireSymbol: string;
  image: string;
  colors: {
    start: string;
    end: string;
  };
};

type WalletTokenMeta = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  /** Logo for the wallet suggestion; relative paths are resolved to absolute URLs at click time. */
  logoUrl?: string;
};

type TokenInputCardProps = {
  label: "Buy" | "Sell";
  value: string;
  onChange: (nextValue: string) => void;
  tokenName: string;
  iconSrc?: string;
  walletToken?: WalletTokenMeta;
  /** Formatted balance under ticker; omit when wallet disconnected */
  balanceText?: string;
};

const resolveWalletTokenLogoUrl = (logoUrl?: string) => {
  if (!logoUrl) return undefined;
  if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) return logoUrl;
  if (typeof window === "undefined") return undefined;
  return logoUrl.startsWith("/") ? `${window.location.origin}${logoUrl}` : `${window.location.origin}/${logoUrl}`;
};

const AddToWalletGlyph = () => (
  <span className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center text-deli-grey" aria-hidden>
    <WalletIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
    <PlusIcon
      className="absolute -bottom-px -right-px h-2 w-2 rounded-full bg-deli-main text-deli-grey ring-1 ring-deli-stroke-grey"
      strokeWidth={2.25}
    />
  </span>
);

const TOKEN_CARD_CLASS =
  "box-border h-[150px] w-full rounded-2xl border border-transparent bg-deli-main [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box] px-[25px] pb-[33px] pt-[22px]";

const numberInputPattern = /^\d*\.?\d*$/;
const TICK_SPACING = 30;
const LICENSE_DECIMALS = 18;
const MIN_SQRT_PRICE_X96_PLUS_ONE = 4295128740n;
const MAX_SQRT_PRICE_X96_MINUS_ONE = 1461446703485210103287273052203988822378723970341n;
const ERC20_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
const ERC20_DECIMALS_ABI = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;
const ERC20_ALLOWANCE_ABI = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
const ERC20_APPROVE_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
const MAX_UINT256 = 2n ** 256n - 1n;

const formatBalanceForDisplay = (raw: bigint, decimals: number) => {
  const full = formatUnits(raw, decimals);
  if (!full.includes(".")) return full;
  const trimmed = full.replace(/\.?0+$/, "");
  return trimmed === "" ? "0" : trimmed;
};

const TokenInputCard = ({
  label,
  value,
  onChange,
  tokenName,
  iconSrc,
  walletToken,
  balanceText,
}: TokenInputCardProps) => {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const handleAddTokenClick = async () => {
    if (!walletClient || !walletToken) return;
    const image = resolveWalletTokenLogoUrl(walletToken.logoUrl ?? iconSrc);
    try {
      await walletClient.watchAsset({
        type: "ERC20",
        options: {
          address: walletToken.address,
          symbol: walletToken.symbol.slice(0, 11),
          decimals: walletToken.decimals,
          ...(image ? { image } : {}),
        },
      });
    } catch (error) {
      console.error("Add token to wallet failed:", error);
    }
  };

  const showAddToWallet = Boolean(walletToken && isConnected && walletClient);

  return (
    <div className={`${TOKEN_CARD_CLASS} flex items-center`}>
      <div className="flex w-full items-end justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-body-3-caps text-deli-light-grey">{label}</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={event => {
              const rawValue = event.target.value;
              if (rawValue === "" || numberInputPattern.test(rawValue)) {
                onChange(rawValue);
              }
            }}
            placeholder="0"
            className="mt-[10px] w-full bg-transparent text-h3 text-deli-white outline-none placeholder:text-deli-white/40"
            aria-label={`${label} amount`}
          />
        </div>

        <div className="relative max-w-[min(100%,240px)] shrink-0 self-end">
          <div className="box-border inline-flex min-w-0 max-w-full items-center rounded-xl border border-transparent bg-deli-main [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box] px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {iconSrc ? (
                <Image
                  src={iconSrc}
                  alt=""
                  width={24}
                  height={24}
                  unoptimized={isAttachmentProxyImageSrc(iconSrc)}
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-deli-background text-[10px] font-medium uppercase text-deli-white">
                  {tokenName.slice(0, 1)}
                </div>
              )}
              <span className="min-w-0 truncate text-body-2 text-deli-white">{tokenName}</span>
            </div>
            {showAddToWallet ? (
              <button
                type="button"
                className="tooltip tooltip-top btn btn-ghost btn-xs ml-0.5 min-h-0 shrink-0 rounded-md p-0.5 text-deli-grey hover:text-deli-grey-light"
                data-tip="Add this token to your wallet"
                aria-label={`Add ${walletToken?.symbol ?? tokenName} to wallet`}
                onClick={event => {
                  event.preventDefault();
                  void handleAddTokenClick();
                }}
              >
                <AddToWalletGlyph />
              </button>
            ) : null}
          </div>
          {balanceText !== undefined ? (
            <span className="absolute top-full right-0 z-0 mt-3 max-w-full truncate text-right text-body-2 tabular-nums text-deli-grey">
              {balanceText}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const CampaignSwapper = ({
  licenseAddress,
  licenseSymbol,
  licenseType,
  numeraireAddress,
  numeraireSymbol,
  image,
  colors,
}: CampaignSwapperProps) => {
  const { address } = useAccount();
  const { login } = usePrivy();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient({ chainId: targetNetwork.id });
  const { writeContractAsync: writeScaffoldContractAsync } = useScaffoldWriteContract("CampaignManager");
  const { signTypedDataAsync } = useSignTypedData();
  const [isDirectionFlipped, setIsDirectionFlipped] = useState(false);
  const [firstAmount, setFirstAmount] = useState("");
  const [secondAmount, setSecondAmount] = useState("");
  const [swapPhase, setSwapPhase] = useState<"idle" | "approving" | "signing" | "submitting">("idle");
  const [licenseDecimals, setLicenseDecimals] = useState(18);
  const [numeraireDecimals, setNumeraireDecimals] = useState(18);
  const quoteRequestRef = useRef(0);
  const numeraireLogoUrl = useMemo(() => getNumeraireLogoUrl(numeraireAddress), [numeraireAddress]);

  const categoryKey = useMemo(() => {
    const match = colors.start.match(/--deli-cat-([a-z]+)-from/);
    return match?.[1] ?? "technology";
  }, [colors.start]);
  const selectedStrokeBackground = `var(--deli-cat-stroke-${categoryKey})`;
  const startColor = colors.start;
  const endColor = colors.end;
  const patentImageUrl = useMemo(() => storageUriToProxiedImageUrl(image), [image]);

  const firstLabel: "Buy" | "Sell" = useMemo(() => (isDirectionFlipped ? "Sell" : "Buy"), [isDirectionFlipped]);
  const secondLabel: "Buy" | "Sell" = useMemo(() => (isDirectionFlipped ? "Buy" : "Sell"), [isDirectionFlipped]);
  const chainId = targetNetwork.id;
  const permit2Address = useMemo(() => {
    const ext = (externalContracts as Record<number, Record<string, { address: string }>>)[chainId];
    return ext?.Permit2?.address as `0x${string}` | undefined;
  }, [chainId]);
  const permit2Abi = useMemo(() => {
    const ext = (externalContracts as Record<number, Record<string, { abi?: readonly unknown[] }>>)[chainId];
    return ext?.Permit2?.abi;
  }, [chainId]);

  const selectedHookContract = useMemo(() => {
    const chainContracts = (
      deployedContracts as Record<number, Record<string, { address: string; abi: readonly unknown[] }>>
    )[chainId];
    return licenseType === "DYNAMIC" ? chainContracts?.DynamicPriceLicenseHook : chainContracts?.FixedPriceLicenseHook;
  }, [chainId, licenseType]);
  const swapRouterAddress = useMemo(() => {
    const chainContracts = (
      deployedContracts as Record<number, Record<string, { address: string; abi: readonly unknown[] }>>
    )[chainId];
    return chainContracts?.LicenseSwapRouter?.address as `0x${string}` | undefined;
  }, [chainId]);

  const balanceQueryEnabled = Boolean(address && licenseAddress && numeraireAddress);

  const { data: licenseBalanceRaw, refetch: refetchLicenseBalance } = useReadContract({
    chainId: targetNetwork.id,
    address: (licenseAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : ["0x0000000000000000000000000000000000000000"],
    query: { enabled: balanceQueryEnabled },
  });

  const { data: numeraireBalanceRaw, refetch: refetchNumeraireBalance } = useReadContract({
    chainId: targetNetwork.id,
    address: (numeraireAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    abi: ERC20_BALANCE_ABI,
    functionName: "balanceOf",
    args: address ? [address] : ["0x0000000000000000000000000000000000000000"],
    query: { enabled: balanceQueryEnabled },
  });

  const refetchTokenBalances = useCallback(async () => {
    await Promise.all([refetchLicenseBalance(), refetchNumeraireBalance()]);
  }, [refetchLicenseBalance, refetchNumeraireBalance]);

  const licenseBalanceLine = useMemo(() => {
    if (!address) return undefined;
    if (licenseBalanceRaw === undefined) return `… ${licenseSymbol}`;
    return `${formatBalanceForDisplay(licenseBalanceRaw as bigint, licenseDecimals)} ${licenseSymbol}`;
  }, [address, licenseBalanceRaw, licenseDecimals, licenseSymbol]);

  const numeraireBalanceLine = useMemo(() => {
    if (!address) return undefined;
    if (numeraireBalanceRaw === undefined) return `… ${numeraireSymbol}`;
    return `${formatBalanceForDisplay(numeraireBalanceRaw as bigint, numeraireDecimals)} ${numeraireSymbol}`;
  }, [address, numeraireBalanceRaw, numeraireDecimals, numeraireSymbol]);

  useEffect(() => {
    let active = true;

    const fetchDecimals = async () => {
      if (!publicClient) return;
      if (!licenseAddress || !numeraireAddress) return;
      try {
        const [license, numeraire] = await Promise.all([
          publicClient.readContract({
            address: licenseAddress as `0x${string}`,
            abi: ERC20_DECIMALS_ABI,
            functionName: "decimals",
          }),
          publicClient.readContract({
            address: numeraireAddress as `0x${string}`,
            abi: ERC20_DECIMALS_ABI,
            functionName: "decimals",
          }),
        ]);
        if (!active) return;
        setLicenseDecimals(Number(license));
        setNumeraireDecimals(Number(numeraire));
      } catch (error) {
        console.error("Failed to fetch token decimals for swap quote:", error);
      }
    };

    fetchDecimals();
    return () => {
      active = false;
    };
  }, [publicClient, licenseAddress, numeraireAddress]);

  const quoteByRawInput = useCallback(
    async (rawValue: string, sourceField: "first" | "second") => {
      if (!publicClient || !selectedHookContract) return;
      if (!rawValue) {
        if (sourceField === "first") setSecondAmount("");
        else setFirstAmount("");
        return;
      }
      if (!licenseAddress || !numeraireAddress) return;
      if (!numberInputPattern.test(rawValue)) return;

      const sourceIsLicense = sourceField === "first";
      const sourceLabel = sourceField === "first" ? firstLabel : secondLabel;
      const sourceDecimals = sourceIsLicense ? licenseDecimals : numeraireDecimals;
      const targetDecimals = sourceIsLicense ? numeraireDecimals : licenseDecimals;
      // "Sell" means entered amount is input; "Buy" means entered amount is output.
      const exactInput = sourceLabel === "Sell";
      // zeroForOne is based on input token, not typed field token.
      const inputIsLicense = exactInput ? sourceIsLicense : !sourceIsLicense;
      const zeroForOne = inputIsLicense;

      let amountRaw: bigint;
      try {
        amountRaw = parseUnits(rawValue, sourceDecimals);
      } catch {
        return;
      }
      if (amountRaw <= 0n) {
        if (sourceField === "first") setSecondAmount("");
        else setFirstAmount("");
        return;
      }

      const requestId = ++quoteRequestRef.current;
      try {
        const result = await publicClient.readContract({
          address: selectedHookContract.address as `0x${string}`,
          abi: [...selectedHookContract.abi],
          functionName: "quote",
          args: [
            {
              currency0: licenseAddress as `0x${string}`,
              currency1: numeraireAddress as `0x${string}`,
              fee: 0,
              tickSpacing: TICK_SPACING,
              hooks: selectedHookContract.address as `0x${string}`,
            },
            {
              zeroForOne,
              amountSpecified: exactInput ? -amountRaw : amountRaw,
              sqrtPriceLimitX96: zeroForOne ? MIN_SQRT_PRICE_X96_PLUS_ONE : MAX_SQRT_PRICE_X96_MINUS_ONE,
            },
          ],
        });

        if (requestId !== quoteRequestRef.current) return;
        const quotedRaw = BigInt(result as bigint);
        const formatted = formatUnits(quotedRaw < 0n ? -quotedRaw : quotedRaw, targetDecimals);

        if (sourceField === "first") setSecondAmount(formatted);
        else setFirstAmount(formatted);
      } catch (error) {
        console.error("Swap quote call failed:", error);
      }
    },
    [
      publicClient,
      selectedHookContract,
      licenseAddress,
      numeraireAddress,
      firstLabel,
      secondLabel,
      licenseDecimals,
      numeraireDecimals,
    ],
  );

  const handleFirstAmountChange = useCallback(
    (nextValue: string) => {
      setFirstAmount(nextValue);
      void quoteByRawInput(nextValue, "first");
    },
    [quoteByRawInput],
  );

  const handleSecondAmountChange = useCallback(
    (nextValue: string) => {
      setSecondAmount(nextValue);
      void quoteByRawInput(nextValue, "second");
    },
    [quoteByRawInput],
  );

  const executeSwap = useCallback(async () => {
    const connectedAddress = address;

    if (!publicClient) {
      toast.error("Wallet client is not ready. Please reconnect your wallet.");
      return;
    }
    if (!connectedAddress) {
      toast.error("Connect your wallet to swap.");
      return;
    }
    if (!permit2Address) {
      toast.error("Swap is not available on this network.");
      return;
    }
    if (!permit2Abi || !swapRouterAddress || !selectedHookContract) {
      toast.error("Swap contracts are not configured for this network.");
      return;
    }
    if (!firstAmount || Number(firstAmount) <= 0) {
      toast.error("Enter an amount to swap.");
      return;
    }

    try {
      setSwapPhase("submitting");

      const buy = firstLabel === "Buy";
      const campaignId = licenseAddress;
      const amountLicenseRaw = parseUnits(firstAmount.trim(), LICENSE_DECIMALS);
      const quotedAmountInRaw = buy
        ? ((await publicClient.readContract({
            address: selectedHookContract.address as `0x${string}`,
            abi: [...selectedHookContract.abi],
            functionName: "quote",
            args: [
              {
                currency0: licenseAddress as `0x${string}`,
                currency1: numeraireAddress as `0x${string}`,
                fee: 0,
                tickSpacing: TICK_SPACING,
                hooks: selectedHookContract.address as `0x${string}`,
              },
              {
                zeroForOne: false,
                amountSpecified: amountLicenseRaw,
                sqrtPriceLimitX96: MAX_SQRT_PRICE_X96_MINUS_ONE,
              },
            ],
          })) as bigint)
        : amountLicenseRaw;
      const amountInRaw = quotedAmountInRaw < 0n ? -quotedAmountInRaw : quotedAmountInRaw;
      const inputTokenAddress = (buy ? numeraireAddress : licenseAddress) as `0x${string}`;
      const permitNonceResult = (await publicClient.readContract({
        address: permit2Address,
        abi: [...permit2Abi],
        functionName: "allowance",
        args: [connectedAddress as Address, inputTokenAddress as Address, swapRouterAddress as Address],
      })) as readonly [bigint, bigint, bigint];

      const permitMessage = normalizePermitMessageForWallet({
        domain: {
          name: "Permit2",
          chainId,
          verifyingContract: permit2Address,
        },
        types: {
          PermitSingle: [
            { name: "details", type: "PermitDetails" },
            { name: "spender", type: "address" },
            { name: "sigDeadline", type: "uint256" },
          ],
          PermitDetails: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint160" },
            { name: "expiration", type: "uint48" },
            { name: "nonce", type: "uint48" },
          ],
        },
        primaryType: "PermitSingle",
        message: {
          details: {
            token: inputTokenAddress,
            amount: amountInRaw.toString(),
            expiration: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60).toString(),
            nonce: permitNonceResult[2].toString(),
          },
          spender: swapRouterAddress,
          sigDeadline: Math.floor(Date.now() / 1000 + 30 * 60).toString(),
        },
      } as PermitMessage);

      const inputToken = permitMessage.message.details.token as `0x${string}`;
      const requiredAmount = BigInt(permitMessage.message.details.amount as string);

      const allowance = (await publicClient.readContract({
        address: inputToken,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: "allowance",
        args: [connectedAddress, permit2Address],
      })) as bigint;

      if (allowance < requiredAmount) {
        setSwapPhase("approving");
        const approveHash = await writeScaffoldContractAsync({
          address: inputToken,
          abi: ERC20_APPROVE_ABI,
          functionName: "approve",
          args: [permit2Address, MAX_UINT256],
        } as any);
        if (!approveHash) {
          throw new Error("Approve transaction failed");
        }
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }

      setSwapPhase("signing");
      const signature = await signTypedDataAsync({
        account: connectedAddress,
        domain: permitMessage.domain,
        types: permitMessage.types,
        primaryType: permitMessage.primaryType,
        message: permitMessage.message,
      });

      setSwapPhase("submitting");
      const relayReq = await fetch(`/api/campaign/${campaignId}?chainId=${chainId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: firstAmount.trim(),
          userAddress: connectedAddress,
          buy,
          permit: {
            message: permitMessage,
            signature,
          },
        }),
      });
      const relayJson = await relayReq.json();
      if (!relayReq.ok) {
        throw new Error(relayJson?.error ?? relayJson?.details ?? "Failed to submit relayed swap.");
      }
      await refetchTokenBalances();
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Swap failed.");
      toast.error(getUserFacingErrorMessage(error, "Swap failed. Please try again."));
    } finally {
      setSwapPhase("idle");
    }
  }, [
    address,
    chainId,
    firstAmount,
    firstLabel,
    licenseAddress,
    licenseType,
    numeraireAddress,
    permit2Address,
    permit2Abi,
    publicClient,
    refetchTokenBalances,
    selectedHookContract,
    signTypedDataAsync,
    swapRouterAddress,
    writeScaffoldContractAsync,
  ]);

  const handleSwapClick = useCallback(() => {
    if (!address) {
      login();
      return;
    }

    void executeSwap();
  }, [address, executeSwap, login]);

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <h3 className="text-h4 text-deli-white">Swap</h3>

      <div className="relative flex flex-col gap-2.5">
        <TokenInputCard
          label={firstLabel}
          value={firstAmount}
          onChange={handleFirstAmountChange}
          tokenName={CAMPAIGN_DISPLAY_TOKEN}
          iconSrc={patentImageUrl ?? undefined}
          walletToken={{
            address: licenseAddress as `0x${string}`,
            symbol: licenseSymbol,
            decimals: licenseDecimals,
            logoUrl: patentImageUrl ?? undefined,
          }}
          balanceText={licenseBalanceLine}
        />
        <TokenInputCard
          label={secondLabel}
          value={secondAmount}
          onChange={handleSecondAmountChange}
          tokenName={numeraireSymbol}
          iconSrc={numeraireLogoUrl}
          walletToken={{
            address: numeraireAddress as `0x${string}`,
            symbol: numeraireSymbol,
            decimals: numeraireDecimals,
            logoUrl: numeraireLogoUrl,
          }}
          balanceText={numeraireBalanceLine}
        />

        <button
          type="button"
          onClick={() => setIsDirectionFlipped(prev => !prev)}
          className="absolute left-1/2 z-10 box-border flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-transparent bg-deli-main [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box]"
          style={{
            top: "calc(150px + 5px)",
            background: `linear-gradient(var(--deli-main),var(--deli-main)) padding-box, ${selectedStrokeBackground} border-box`,
          }}
          aria-label="Toggle swap direction"
        >
          {arrowsSwapSvg({ startColor, endColor })}
        </button>
      </div>

      <button
        type="button"
        onClick={handleSwapClick}
        disabled={swapPhase !== "idle"}
        className="box-border flex h-[65px] w-full cursor-pointer items-center justify-center rounded-2xl border border-transparent bg-deli-main py-5 text-center text-h6"
        style={{
          border: "1px solid transparent",
          backgroundImage: `linear-gradient(var(--deli-main),var(--deli-main)), ${selectedStrokeBackground}`,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        <span className="text-deli-white">
          {swapPhase === "approving"
            ? "Approving..."
            : swapPhase === "signing"
              ? "Signing..."
              : swapPhase === "submitting"
                ? "Submitting..."
                : "Swap"}
        </span>
      </button>
    </div>
  );
};

export default CampaignSwapper;
