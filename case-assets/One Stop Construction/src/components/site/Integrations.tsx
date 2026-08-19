import iconUrl from "@/assets/logo-tower.png";
import wordmarkUrl from "@/assets/logo-official.png";
import { Reveal, Section, SectionHeading } from "./primitives";

const CATEGORIES = [
  "Accounting & books",
  "Banks & cards",
  "Time & attendance",
  "Estimating",
  "Payroll providers",
  "Docs & storage",
  "Email & calendar",
  "Spreadsheets",
];

export function Integrations() {
  return (
    <Section id="integrations" className="border-t border-line bg-surface-0">
      <SectionHeading
        eyebrow="Integrations"
        title="Keep your tools. We plug in."
        sub="You don't have to rip anything out. One Stop reads from what you already use and turns it into one set of numbers."
      />

      <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
        <ul className="space-y-2">
          {CATEGORIES.slice(0, 4).map((c, i) => (
            <Reveal as="li" key={c} delay={i * 60}>
              <div className="rounded-[12px] border border-line bg-surface-2 px-4 py-3.5 text-[14px] text-ink-2 lg:text-right">
                {c}
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={120}>
          <div className="relative mx-auto grid h-72 w-72 place-items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden
                className="absolute h-44 w-44 rounded-full border border-accent"
                style={{ animation: `ring-pulse 3.2s ease-out ${i * 1.05}s infinite` }}
              />
            ))}
            <div className="relative flex h-52 w-48 flex-col items-center justify-center gap-3 rounded-[12px] border border-accent bg-surface-2 p-4">
              <img src={iconUrl} alt="One Stop" width={80} height={80} className="h-20 w-20" />
              <img src={wordmarkUrl} alt="One Stop Shop Construction" width={718} height={134} className="h-9 w-auto" />
            </div>
          </div>
        </Reveal>

        <ul className="space-y-2">
          {CATEGORIES.slice(4).map((c, i) => (
            <Reveal as="li" key={c} delay={i * 60}>
              <div className="rounded-[12px] border border-line bg-surface-2 px-4 py-3.5 text-[14px] text-ink-2">
                {c}
              </div>
            </Reveal>
          ))}
        </ul>
      </div>

      <Reveal delay={120}>
        <p className="display mt-12 text-center text-[clamp(26px,3.6vw,40px)] tracking-[2px]">
          One source of <span className="text-accent">truth.</span>
        </p>
      </Reveal>
    </Section>
  );
}
