import { createConfig } from "@privy-io/wagmi";
import { Chain, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import scaffoldConfig, { DEFAULT_ALCHEMY_API_KEY, ScaffoldConfig } from "~~/scaffold.config";
import { getAlchemyHttpUrl, withConfiguredRpcUrls } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

const baseEnabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);

// Privy embedded wallets broadcast via chain.rpcUrls — overrides must live on the chain object.
export const enabledChains = baseEnabledChains.map(withConfiguredRpcUrls) as unknown as typeof baseEnabledChains;

export const wagmiConfig = createConfig({
  chains: enabledChains,
  ssr: true,
  client: ({ chain }) => {
    const rpcOverrideUrl = (scaffoldConfig.rpcOverrides as ScaffoldConfig["rpcOverrides"])?.[chain.id];

    if (rpcOverrideUrl) {
      return createClient({
        chain,
        transport: http(rpcOverrideUrl),
        ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
      });
    }

    const mainnetFallbackWithDefaultRPC = [http("https://mainnet.rpc.buidlguidl.com")];
    let rpcFallbacks = [...(chain.id === mainnet.id ? mainnetFallbackWithDefaultRPC : []), http()];
    const alchemyHttpUrl = getAlchemyHttpUrl(chain.id);
    if (alchemyHttpUrl) {
      const isUsingDefaultKey = scaffoldConfig.alchemyApiKey === DEFAULT_ALCHEMY_API_KEY;
      rpcFallbacks = isUsingDefaultKey
        ? [...rpcFallbacks, http(alchemyHttpUrl)]
        : [http(alchemyHttpUrl), ...rpcFallbacks];
    }

    return createClient({
      chain,
      transport: fallback(rpcFallbacks),
      ...(chain.id !== (hardhat as Chain).id ? { pollingInterval: scaffoldConfig.pollingInterval } : {}),
    });
  },
});
