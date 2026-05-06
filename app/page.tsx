import { Architecture } from "./components/Architecture";
import { Benefits } from "./components/Benefits";
import { BuiltOn } from "./components/BuiltOn";
import { Domains } from "./components/Domains";
import { Footer } from "./components/Footer";
import { FinalCta } from "./components/FinalCta";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Insight } from "./components/Insight";
import { Nav } from "./components/Nav";
import { TokenFlow } from "./components/TokenFlow";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BuiltOn />
        <HowItWorks />
        <Benefits />
        <Insight />
        <Domains />
        <Architecture />
        <TokenFlow />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
