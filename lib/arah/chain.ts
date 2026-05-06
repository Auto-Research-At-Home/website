import { defineChain } from "viem";

/** Default public RPC; override with `NEXT_PUBLIC_GALILEO_RPC_URL`. */
export const GALILEO_DEFAULT_RPC_URL =
  "https://evmrpc-testnet.0g.ai" as const;

export function getGalileoRpcUrl(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_GALILEO_RPC_URL
      : undefined;
  return fromEnv && fromEnv.length > 0 ? fromEnv : GALILEO_DEFAULT_RPC_URL;
}

/**
 * Official Galileo testnet chain ID per 0G docs (hex `0x40da`).
 * Some wallets still ship an older duplicate preset at **16618 (`0x40ea`)**
 * with the same RPC; that blocks adding 16602 until the user removes it.
 */
export const galileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: [getGalileoRpcUrl()] },
  },
  blockExplorers: {
    default: {
      name: "0G Galileo Chainscan",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
});

export const PROJECT_REGISTRY_ADDRESS =
  "0xc84768e450534974C0DD5BAb7c1b695744124136" as const;

export const PROPOSAL_LEDGER_ADDRESS =
  "0x701db5f8Ed847651209A438695dfe5520adD6A5A" as const;

export const VERIFIER_REGISTRY_ADDRESS =
  "0x257974E406f206BfAEd3abB8D93C232e3226f032" as const;
