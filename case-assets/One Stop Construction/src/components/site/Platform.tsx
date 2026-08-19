import { useEffect, useState } from "react";
import { Reveal, Section, SectionHeading, StatusPill } from "./primitives";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, useInView } from "@/lib/site-motion";

type Row = { left: string; mid: string; right: string; tone: "ok" | "warn" | "crit" | "muted" };

const MODULES: {
  key: string;
  name: string;
  blurb: string;
  screen: string;
  rows: Row[];
}[] = [
  {
    key: "finance",
    name: "Finance",
    blurb: "Job costing, invoices, cost codes and books that close on time.",
    screen: "finance / job costing",
    rows: [
      { left: "01-220", mid: "Maple St. Remodel", right: "$12,480.00", tone: "ok" },
      { left: "03-310", mid: "Ridgeview Build", right: "$48,905.12", tone: "ok" },
      { left: "06-100", mid: "Job 118 Framing", right: "$9,640.00", tone: "warn" },
      { left: "22-050", mid: "Decatur Duplex", right: "$17,002.40", tone: "crit" },
    ],
  },
  {
    key: "projects",
    name: "Projects",
    blurb: "Phases, schedules, change orders and budget against actuals.",
    screen: "projects / phases",
    rows: [
      { left: "Phase 01", mid: "Sitework", right: "100%", tone: "ok" },
      { left: "Phase 02", mid: "Framing", right: "78%", tone: "crit" },
      { left: "Phase 03", mid: "Mechanical", right: "54%", tone: "warn" },
      { left: "Phase 04", mid: "Drywall", right: "22%", tone: "muted" },
    ],
  },
  {
    key: "field",
    name: "Field",
    blurb: "Daily logs, photos, punch lists and time from the jobsite.",
    screen: "field / daily logs",
    rows: [
      { left: "07:02", mid: "Crew A on site · 6 people", right: "Logged", tone: "ok" },
      { left: "09:41", mid: "Inspection passed · footings", right: "Passed", tone: "ok" },
      { left: "13:18", mid: "Material short · 12 studs", right: "Open", tone: "warn" },
      { left: "16:30", mid: "Punch item · window trim", right: "Open", tone: "warn" },
    ],
  },
  {
    key: "people",
    name: "People",
    blurb: "Time, crews, certifications and payroll that matches the hours.",
    screen: "people / payroll run",
    rows: [
      { left: "27", mid: "People on payroll", right: "Ready", tone: "ok" },
      { left: "1,082", mid: "Hours this period", right: "Matched", tone: "ok" },
      { left: "14", mid: "Overtime hours", right: "Review", tone: "warn" },
      { left: "2", mid: "Certifications expiring", right: "Action", tone: "crit" },
    ],
  },
];

const DURATION = 6000;

export function Platform() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!inView || !auto || prefersReducedMotion()) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = ((now - start) % DURATION) / DURATION;
      setProgress(t * 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const id = window.setInterval(() => setActive((a) => (a + 1) % MODULES.length), DURATION);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [inView, auto]);

  const mod = MODULES[active]!;

  return (
    <Section id="platform" className="border-t border-line bg-surface-0">
      <SectionHeading
        eyebrow="The platform"
        title="Four modules. One system."
        sub="Everything an owner has to run, in one place. Change something in the field and the money side already knows."
      />

      <div ref={ref} className="mt-14 grid gap-4 lg:grid-cols-[320px_1fr]">
        <ul className="space-y-2">
          {MODULES.map((m, i) => (
            <li key={m.key}>
              <button
                type="button"
                onClick={() => {
                  setActive(i);
                  setAuto(false);
                  setProgress(0);
                }}
                aria-current={i === active}
                className={cn(
                  "w-full rounded-[12px] border p-4 text-left transition-colors",
                  i === active
                    ? "border-line-strong bg-surface-2"
                    : "border-line bg-surface-1 hover:bg-surface-2",
                )}
                style={{
                  borderLeft: `3px solid ${
                    i === active ? "var(--color-accent)" : "var(--color-line)"
                  }`,
                }}
              >
                <span className="display block text-[22px] tracking-[2px]">{m.name}</span>
                <span className="mt-1.5 block max-w-[46ch] text-[13.5px] text-ink-2">
                  {m.blurb}
                </span>
                {i === active ? (
                  <span className="mt-3 block h-[3px] w-full overflow-hidden rounded-[6px] bg-surface-3">
                    <span
                      className="block h-full bg-accent"
                      style={{ width: auto ? `${progress}%` : "100%" }}
                    />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        <Reveal>
          <div className="overflow-hidden rounded-[12px] border border-line-strong bg-surface-2">
            <div className="flex items-center justify-between border-b border-line bg-surface-0 px-4 py-3">
              <span className="mono-label">{mod.screen}</span>
              <StatusPill tone="ok" pulse>
                Synced
              </StatusPill>
            </div>
            <div key={mod.key} className="animate-[fade-in_0.35s_ease-out] p-4 sm:p-5">
              <ul className="space-y-2">
                {mod.rows.map((r) => (
                  <li
                    key={r.left + r.mid}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] border border-line bg-surface-1 px-4 py-3.5"
                  >
                    <span className="num shrink-0 text-[12px] text-ink-3">{r.left}</span>
                    <span className="truncate text-[14px]">{r.mid}</span>
                    <span className="num shrink-0 text-[12px] text-ink-2">{r.right}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {mod.rows.map((r) => (
                  <StatusPill key={r.left + "pill"} tone={r.tone}>
                    {r.left}
                  </StatusPill>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
