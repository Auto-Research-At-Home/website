import { galileo, getGalileoRpcUrl } from "./chain";

const rpcUrl = getGalileoRpcUrl();

type EthereumRequest = (args: {
  method: string;
  params?: unknown[];
}) => Promise<unknown>;

function getInjectedProvider(): EthereumRequest | null {
  if (typeof window === "undefined") return null;
  const win = window as unknown as { ethereum?: { request: EthereumRequest } };
  return win.ethereum?.request ?? null;
}

function errMeta(err: unknown): { code?: number; message: string } {
  if (err && typeof err === "object" && "message" in err) {
    const code =
      "code" in err && typeof (err as { code: unknown }).code === "number"
        ? (err as { code: number }).code
        : undefined;
    return {
      code,
      message: String((err as { message: unknown }).message),
    };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}

function isChainNotAdded(code: number | undefined, message: string): boolean {
  if (code === 4902) return true;
  const m = message.toLowerCase();
  return (
    m.includes("unrecognized chain") ||
    m.includes("chain not added") ||
    m.includes("wallet_addethereumchain")
  );
}

function isDuplicateNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("same rpc") ||
    m.includes("same rpc endpoint") ||
    m.includes("points to same rpc") ||
    m.includes("existing network") ||
    m.includes("already been added") ||
    m.includes("duplicate") ||
    m.includes("0x40ea")
  );
}

function addChainParams(forRpc: string) {
  const chainIdHex = `0x${galileo.id.toString(16)}` as `0x${string}`;
  return {
    chainId: chainIdHex,
    chainName: galileo.name,
    nativeCurrency: galileo.nativeCurrency,
    rpcUrls: [forRpc],
    blockExplorerUrls: [galileo.blockExplorers.default.url],
  };
}

const METAMASK_CONFLICT_HELP = [
  "Galileo chain conflict in MetaMask.",
  "",
  `This app uses the official network: chain ID ${galileo.id} (hex 0x${galileo.id.toString(16)}).`,
  "MetaMask often has an older duplicate named “0G-Galileo-Testnet” with chain ID 16618 (0x40ea) pointing at the same RPC. That blocks adding the correct chain.",
  "",
  "Fix: MetaMask → ☰ → Networks → find the Galileo / 0G entry that shows chain 16618 (0x40ea) and delete it, then click “Switch network” again.",
  "",
  "Docs: https://docs.0g.ai/developer-hub/testnet/testnet-overview",
].join("\n");

/**
 * Switches the injected wallet to 0G Galileo (16602 / 0x40da).
 * MetaMask: switch first; add only on 4902; if add fails because another
 * network already uses this RPC with a wrong chain id, we explain how to fix.
 */
export async function switchToGalileoWallet(): Promise<void> {
  const request = getInjectedProvider();
  if (!request) throw new Error("No injected wallet (window.ethereum).");

  const chainIdHex = `0x${galileo.id.toString(16)}` as `0x${string}`;

  try {
    await request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return;
  } catch (switchErr: unknown) {
    const { code, message } = errMeta(switchErr);
    if (!isChainNotAdded(code, message)) throw switchErr;
  }

  try {
    await request({
      method: "wallet_addEthereumChain",
      params: [addChainParams(rpcUrl)],
    });
    return;
  } catch (addErr: unknown) {
    const { message } = errMeta(addErr);
    if (!isDuplicateNetworkError(message)) throw addErr;
  }

  const alt =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_GALILEO_WALLET_ADD_RPC_URL
      : undefined;
  if (alt && alt.length > 0 && alt !== rpcUrl) {
    try {
      await request({
        method: "wallet_addEthereumChain",
        params: [addChainParams(alt)],
      });
      return;
    } catch {
      /* fall through to switch + help */
    }
  }

  try {
    await request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return;
  } catch {
    throw new Error(METAMASK_CONFLICT_HELP);
  }
}
