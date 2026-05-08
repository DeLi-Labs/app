"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createWalletClient, http, parseEther, parseUnits } from "viem";
import { useAccount, useWalletClient } from "wagmi";
import { ETH_FAUCET_ICON, NUMERAIRE_FAUCET_ICON } from "~~/components/assets/common";
import { CAMPAIGN_NUMERAIRE_ADDRESSES, getNumeraireLogoUrl } from "~~/utils/numeraireImageMap";
import { useEnsureAppNetwork, useScaffoldWriteContract, useTargetNetwork, useTransactor } from "~~/hooks/scaffold-eth";
import { getRpcHttpUrl } from "~~/utils/scaffold-eth";

/** Default Hardhat / Anvil account #0 — only has funds on typical local RPCs. */
const FAUCET_SENDER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;
const MUSDC_MINT_AMOUNT = "1000000";
/** OpenZeppelin default for MockNumeraire (no override). */
const MUSDC_DECIMALS = 18;

const resolveTokenImageUrl = (logoPath: string) => {
  if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) return logoPath;
  if (typeof window === "undefined") return undefined;
  return logoPath.startsWith("/") ? `${window.location.origin}${logoPath}` : `${window.location.origin}/${logoPath}`;
};

export const ProfileSidebarMintButtons = () => {
  const { address, chain: connectedChain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  const ensureAppNetwork = useEnsureAppNetwork();
  const hasPromptedNetworkRef = useRef(false);

  const faucetWalletClient = useMemo(
    () =>
      createWalletClient({
        chain: targetNetwork,
        transport: http(getRpcHttpUrl(targetNetwork.id)),
      }),
    [targetNetwork],
  );
  const faucetTxn = useTransactor(faucetWalletClient);

  const { writeContractAsync: mintMusdc } = useScaffoldWriteContract({
    contractName: "MockNumeraire",
  });

  const [ethLoading, setEthLoading] = useState(false);
  const [musdcLoading, setMusdcLoading] = useState(false);

  useEffect(() => {
    if (!address || hasPromptedNetworkRef.current || connectedChain?.id === targetNetwork.id) {
      return;
    }

    hasPromptedNetworkRef.current = true;
    void ensureAppNetwork({
      id: targetNetwork.id,
      name: targetNetwork.name,
    });
  }, [address, connectedChain?.id, ensureAppNetwork, targetNetwork.id, targetNetwork.name]);

  if (!address || connectedChain?.id !== targetNetwork.id) {
    return null;
  }

  const numeraireAddress = CAMPAIGN_NUMERAIRE_ADDRESSES[0];

  const mintOneEth = async () => {
    if (!address) return;
    try {
      setEthLoading(true);
      await faucetTxn({
        account: FAUCET_SENDER,
        to: address,
        value: parseEther("1"),
      });
    } catch (error) {
      console.error("Profile sidebar ETH mint failed:", error);
    } finally {
      setEthLoading(false);
    }
  };

  const addTokenAndMintMusdc = async () => {
    if (!address || !walletClient) return;
    try {
      setMusdcLoading(true);
      const image = resolveTokenImageUrl(getNumeraireLogoUrl(numeraireAddress));
      try {
        await walletClient.watchAsset({
          type: "ERC20",
          options: {
            address: numeraireAddress,
            symbol: "mUSDC",
            decimals: MUSDC_DECIMALS,
            ...(image ? { image } : {}),
          },
        });
      } catch (watchErr) {
        console.warn("watchAsset dismissed or failed; continuing with mint:", watchErr);
      }

      await mintMusdc({
        functionName: "mint",
        args: [address, parseUnits(MUSDC_MINT_AMOUNT, MUSDC_DECIMALS)],
      });
    } catch (error) {
      console.error("Profile sidebar mUSDC mint failed:", error);
    } finally {
      setMusdcLoading(false);
    }
  };

  const btnClass =
    "flex h-10 w-full min-w-0 cursor-pointer items-center justify-center rounded-xl border border-transparent transition-opacity [background:linear-gradient(var(--deli-main),var(--deli-main))_padding-box,var(--deli-stroke-grey)_border-box] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="grid w-full grid-cols-2 gap-5">
      <button
        type="button"
        className={btnClass}
        onClick={mintOneEth}
        disabled={!address || ethLoading}
        aria-label="Mint 1 ETH (sends from dev faucet account when available)"
      >
        {ethLoading ? <span className="loading loading-spinner loading-sm text-deli-grey" /> : ETH_FAUCET_ICON}
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={addTokenAndMintMusdc}
        disabled={!address || !walletClient || musdcLoading}
        aria-label="Add mUSDC to wallet and mint 1,000,000 mUSDC"
      >
        {musdcLoading ? <span className="loading loading-spinner loading-sm text-deli-grey" /> : NUMERAIRE_FAUCET_ICON}
      </button>
    </div>
  );
};
