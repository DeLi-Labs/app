import { useAccount, useSwitchChain } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

type TargetNetwork = {
  id: number;
  name: string;
};

/**
 * Ensures the connected wallet is on the app-selected target network.
 * Prompts a network switch in the wallet when needed.
 */
export const useEnsureAppNetwork = () => {
  const { chain: accountChain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  return async (targetNetwork: TargetNetwork): Promise<boolean> => {
    if (!accountChain?.id) {
      notification.error("Please connect your wallet");
      return false;
    }

    if (accountChain.id === targetNetwork.id) {
      return true;
    }

    if (!switchChainAsync) {
      notification.error(`Wallet is connected to the wrong network. Please switch to ${targetNetwork.name}`);
      return false;
    }

    try {
      await switchChainAsync({ chainId: targetNetwork.id });
      return true;
    } catch (error) {
      console.error("Failed to switch wallet network:", error);
      notification.error(`Please switch your wallet to ${targetNetwork.name} to continue`);
      return false;
    }
  };
};
