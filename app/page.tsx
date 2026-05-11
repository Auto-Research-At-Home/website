import { SOLANA_CLUSTER } from "@/lib/openResearch/client";
import { HIDDEN_PROJECT_IDS } from "@/lib/openResearch/projectUi";
import { listProjects } from "@/lib/openResearch/read";
import { SYSTEM_PROGRAM } from "@/lib/openResearch/format";
import { Domains } from "./components/Domains";
import { FAQ } from "./components/FAQ";
import { Featured } from "./components/Featured";
import { Footer } from "./components/Footer";
import { FinalCta } from "./components/FinalCta";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Insight } from "./components/Insight";
import { Nav } from "./components/Nav";

export const revalidate = 30;

export default async function HomePage() {
  const stats = await loadHeroStats();

  return (
    <>
      <Nav />
      <main>
        <Hero stats={stats} />
        <Insight />
        <HowItWorks />
        <Featured />
        <Domains />
        <FinalCta />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}

async function loadHeroStats() {
  try {
    const projects = (await listProjects()).filter(
      (project) => !HIDDEN_PROJECT_IDS.has(project.id),
    );
    const acceptedBests = projects.filter(
      (project) => project.currentBestMiner.toBase58() !== SYSTEM_PROGRAM,
    ).length;
    const openPools = projects.filter(
      (project) => project.minerPoolCap > project.minerPoolMinted,
    ).length;
    const latest = [...projects].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    )[0];

    return {
      projectCount: projects.length.toLocaleString(),
      acceptedBests: acceptedBests.toLocaleString(),
      openPools: openPools.toLocaleString(),
      cluster: SOLANA_CLUSTER,
      latestProject: latest?.tokenSymbol ?? "-",
    };
  } catch {
    return {
      projectCount: "-",
      acceptedBests: "-",
      openPools: "-",
      cluster: SOLANA_CLUSTER,
      latestProject: "-",
    };
  }
}
