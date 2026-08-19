import { createFileRoute } from "@tanstack/react-router";
import { LiveStrip } from "@/components/site/LiveStrip";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { SiteNav } from "@/components/site/SiteNav";
import { Hero } from "@/components/site/Hero";
import { Problem } from "@/components/site/Problem";
import { Platform } from "@/components/site/Platform";
import { Agents } from "@/components/site/Agents";
import { Integrations } from "@/components/site/Integrations";
import { Company } from "@/components/site/Company";
import { CloseCta } from "@/components/site/CloseCta";
import { SiteFooter } from "@/components/site/SiteFooter";

const TITLE = "One Stop Construction OS — Run the Whole Company";
const DESC =
  "Finance, projects, field and payroll in one system, with AI agents that do the admin work. Built inside a working construction company in Atlanta.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-dvh bg-surface-1">
      <LiveStrip />
      <ScrollProgress />
      <SiteNav />
      <main>
        <Hero />
        <Problem />
        <Platform />
        <Agents />
        <Integrations />
        <Company />
        <CloseCta />
      </main>
      <SiteFooter />
    </div>
  );
}
