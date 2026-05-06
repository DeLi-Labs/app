"use client";

// @refresh reset
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { usePrivy } from "@privy-io/react-auth";
import { Balance } from "@scaffold-ui/components";
import { getBlockExplorerAddressLink } from "@scaffold-ui/hooks";
import { Address } from "viem";
import { useAccount, useEnsName } from "wagmi";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { enabledChains } from "~~/services/web3/wagmiConfig";

/**
 * Custom Privy + Wagmi connect button (watch balance + custom design)
 */
export const PrivyConnectButton = () => {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address, chainId } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const connectedChain = enabledChains.find(chain => chain.id === chainId);
  const connected = ready && authenticated && !!address;
  const blockExplorerAddressLink = address ? getBlockExplorerAddressLink(targetNetwork, address) : undefined;
  const displayName =
    ensName || user?.email?.address || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Account");

  return (
    <>
      {!connected ? (
        <button className="btn btn-primary btn-sm" onClick={login} type="button" disabled={!ready}>
          Connect Wallet
        </button>
      ) : connectedChain?.id !== targetNetwork.id ? (
        <WrongNetworkDropdown onDisconnect={logout} />
      ) : (
        <>
          <div className="flex flex-col items-center mr-2">
            <Balance
              address={address as Address}
              style={{
                minHeight: "0",
                height: "auto",
                fontSize: "0.8em",
              }}
            />
            <span className="text-xs" style={{ color: networkColor }}>
              {connectedChain?.name ?? "Unknown network"}
            </span>
          </div>
          <AddressInfoDropdown
            address={address as Address}
            displayName={displayName}
            blockExplorerAddressLink={blockExplorerAddressLink}
            onDisconnect={logout}
          />
          <AddressQRCodeModal address={address as Address} modalId="qrcode-modal" />
        </>
      )}
    </>
  );
};