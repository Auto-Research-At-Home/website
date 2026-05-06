import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  injected,
} from "wagmi";
import { galileo, getGalileoRpcUrl } from "./chain";

const rpcUrl = getGalileoRpcUrl();

/**
 * Injected wallets only (no WalletConnect / project ID).
 * Cookie storage + SSR initial state in the root layout restores sessions across
 * navigations and full reloads so users are not prompted to connect again.
 */
export const wagmiConfig = createConfig({
  chains: [galileo],
  connectors: [injected()],
  transports: {
    [galileo.id]: http(rpcUrl),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});
