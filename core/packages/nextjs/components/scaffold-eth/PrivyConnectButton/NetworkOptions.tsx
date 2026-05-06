import { useWallets } from "@privy-io/react-auth";
import { useTheme } from "next-themes";
import { useAccount, useSwitchChain } from "wagmi";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/solid";
import { getNetworkColor } from "~~/hooks/scaffold-eth";
import { getParsedError, getTargetNetworks, notification } from "~~/utils/scaffold-eth";

const allowedNetworks = getTargetNetworks();

type NetworkOptionsProps = {
  hidden?: boolean;
};

export const NetworkOptions = ({ hidden = false }: NetworkOptionsProps) => {
  const { switchChainAsync } = useSwitchChain();
  const { chain, address } = useAccount();
  const { wallets } = useWallets();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const handleSwitchNetwork = async (chainId: number) => {
    let wagmiSwitchError: unknown;

    try {
      await switchChainAsync({ chainId });
      return;
    } catch (error) {
      wagmiSwitchError = error;
    }

    try {
      const activeWallet = wallets.find(
        wallet => wallet.address?.toLowerCase() === address?.toLowerCase() && wallet.walletClientType === "privy",
      );
      if (!activeWallet) {
        throw wagmiSwitchError ?? new Error("No active Privy embedded wallet found.");
      }
      await activeWallet.switchChain(chainId);
    } catch (error) {
      notification.error(getParsedError(error ?? wagmiSwitchError));
    }
  };

  return (
    <>
      {allowedNetworks
        .filter(allowedNetwork => allowedNetwork.id !== chain?.id)
        .map(allowedNetwork => (
          <li key={allowedNetwork.id} className={hidden ? "hidden" : ""}>
            <button
              className="menu-item btn-sm rounded-xl! flex gap-3 py-3 whitespace-nowrap"
              type="button"
              onClick={() => {
                void handleSwitchNetwork(allowedNetwork.id);
              }}
            >
              <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span>
                Switch to{" "}
                <span
                  style={{
                    color: getNetworkColor(allowedNetwork, isDarkMode),
                  }}
                >
                  {allowedNetwork.name}
                </span>
              </span>
            </button>
          </li>
        ))}
    </>
  );
};
