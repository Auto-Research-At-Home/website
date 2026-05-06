type WatchAssetParams = {
  type: "ERC20";
  options: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
    image?: string;
  };
};

type EthereumRequest = (args: {
  method: string;
  params?: unknown;
}) => Promise<unknown>;

function getInjectedProvider(): EthereumRequest | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as { ethereum?: { request: EthereumRequest } };
  return win.ethereum?.request ?? null;
}

/** MetaMask limits token symbol length when importing. */
const MAX_SYMBOL_LEN = 11;

/**
 * Prompts the injected wallet to track this ERC-20 (MetaMask: “Add token”).
 * Uses `wallet_watchAsset` (EIP-747).
 */
export async function watchErc20InWallet(params: {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  /** HTTPS URL to a small PNG/SVG; optional. */
  image?: string;
}): Promise<void> {
  const request = getInjectedProvider();
  if (!request) throw new Error("No injected wallet (window.ethereum).");

  const symbol =
    params.symbol.length > MAX_SYMBOL_LEN
      ? params.symbol.slice(0, MAX_SYMBOL_LEN)
      : params.symbol;

  const payload: WatchAssetParams = {
    type: "ERC20",
    options: {
      address: params.address,
      symbol,
      decimals: params.decimals,
      ...(params.image ? { image: params.image } : {}),
    },
  };

  await request({
    method: "wallet_watchAsset",
    params: payload,
  });
}
