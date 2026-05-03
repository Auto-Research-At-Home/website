import {
  createPublicClient,
  formatEther,
  http,
  type ContractFunctionReturnType,
} from "viem";
import { galileo, PROJECT_REGISTRY_ADDRESS } from "./chain";
import { projectRegistryAbi, projectTokenAbi } from "./abis";

type ProjectStruct = ContractFunctionReturnType<
  typeof projectRegistryAbi,
  "view",
  "getProject"
>;

const rpcUrl =
  process.env.NEXT_PUBLIC_GALILEO_RPC_URL ?? "https://evmrpc-testnet.0g.ai";

const registryAddress =
  (process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS as
    | `0x${string}`
    | undefined) ?? PROJECT_REGISTRY_ADDRESS;

export const publicClient = createPublicClient({
  chain: galileo,
  transport: http(rpcUrl),
});

export type ListedProject = {
  id: number;
  protocolHash: `0x${string}`;
  repoSnapshotHash: `0x${string}`;
  benchmarkHash: `0x${string}`;
  baselineAggregateScore: bigint;
  baselineMetricsHash: `0x${string}`;
  currentBestCodeHash: `0x${string}`;
  currentBestAggregateScore: bigint;
  currentBestMetricsHash: `0x${string}`;
  currentBestMiner: `0x${string}`;
  creator: `0x${string}`;
  createdAt: Date;
  token: {
    address: `0x${string}`;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    currentPriceWei: bigint;
    currentPriceDisplay: string;
    basePriceWei: bigint;
    slopeWei: bigint;
    minerPoolCap: bigint;
    minerPoolMinted: bigint;
  };
};

export async function fetchListedProjects(): Promise<ListedProject[]> {
  const count = await publicClient.readContract({
    address: registryAddress,
    abi: projectRegistryAbi,
    functionName: "nextProjectId",
  });

  if (count === 0n) return [];

  const projectIds = Array.from({ length: Number(count) }, (_, id) =>
    BigInt(id),
  );

  const projectReads = (await publicClient.multicall({
    allowFailure: false,
    contracts: projectIds.map((projectId) => ({
      address: registryAddress,
      abi: projectRegistryAbi,
      functionName: "getProject",
      args: [projectId],
    })),
  })) as unknown as ProjectStruct[];

  const tokenBaseReads = (await publicClient.multicall({
    allowFailure: false,
    contracts: projectReads.flatMap((project) => {
      const tokenAddress = project.token;
      return [
        { address: tokenAddress, abi: projectTokenAbi, functionName: "name" },
        { address: tokenAddress, abi: projectTokenAbi, functionName: "symbol" },
        {
          address: tokenAddress,
          abi: projectTokenAbi,
          functionName: "decimals",
        },
        {
          address: tokenAddress,
          abi: projectTokenAbi,
          functionName: "totalSupply",
        },
        {
          address: tokenAddress,
          abi: projectTokenAbi,
          functionName: "basePrice",
        },
        { address: tokenAddress, abi: projectTokenAbi, functionName: "slope" },
        {
          address: tokenAddress,
          abi: projectTokenAbi,
          functionName: "minerPoolCap",
        },
        {
          address: tokenAddress,
          abi: projectTokenAbi,
          functionName: "minerPoolMinted",
        },
      ];
    }),
  })) as unknown as Array<string | bigint | number>;

  const priceReads = (await publicClient.multicall({
    allowFailure: false,
    contracts: projectReads.map((project, index) => {
      const offset = index * 8;
      const totalSupply = tokenBaseReads[offset + 3] as bigint;
      return {
        address: project.token,
        abi: projectTokenAbi,
        functionName: "priceAt",
        args: [totalSupply],
      };
    }),
  })) as unknown as bigint[];

  return projectReads.map((project, index) => {
    const offset = index * 8;
    const totalSupply = tokenBaseReads[offset + 3] as bigint;
    const currentPriceWei = priceReads[index] as bigint;

    return {
      id: index,
      protocolHash: project.protocolHash,
      repoSnapshotHash: project.repoSnapshotHash,
      benchmarkHash: project.benchmarkHash,
      baselineAggregateScore: project.baselineAggregateScore,
      baselineMetricsHash: project.baselineMetricsHash,
      currentBestCodeHash: project.currentBestCodeHash,
      currentBestAggregateScore: project.currentBestAggregateScore,
      currentBestMetricsHash: project.currentBestMetricsHash,
      currentBestMiner: project.currentBestMiner,
      creator: project.creator,
      createdAt: new Date(Number(project.createdAt) * 1000),
      token: {
        address: project.token,
        name: tokenBaseReads[offset] as string,
        symbol: tokenBaseReads[offset + 1] as string,
        decimals: tokenBaseReads[offset + 2] as number,
        totalSupply,
        currentPriceWei,
        currentPriceDisplay: `${formatEther(currentPriceWei)} 0G`,
        basePriceWei: tokenBaseReads[offset + 4] as bigint,
        slopeWei: tokenBaseReads[offset + 5] as bigint,
        minerPoolCap: tokenBaseReads[offset + 6] as bigint,
        minerPoolMinted: tokenBaseReads[offset + 7] as bigint,
      },
    };
  });
}
