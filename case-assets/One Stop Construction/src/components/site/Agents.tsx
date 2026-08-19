import { Reveal, Section, SectionHeading, StatusPill } from "./primitives";
import { cn } from "@/lib/utils";
import { useCountUp, useInView, useStepper } from "@/lib/site-motion";

function AgentCard({
  name,
  title,
  body,
  children,
}: {
  name: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <article
        className="flex h-full flex-col rounded-[12px] border border-line bg-surface-2 p-6"
        style={{ borderLeft: "3px solid var(--color-accent)" }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <span className="mono-label truncate">{name}</span>
          <StatusPill tone="ok" pulse>
            Running
          </StatusPill>
        </div>
        <h3 className="display mt-3 text-[26px] tracking-[2px]">{title}</h3>
        <p className="mt-3 max-w-[52ch] text-[14.5px] text-ink-2">{body}</p>
        <div className="mt-6 rounded-[12px] border border-line bg-surface-0 p-4">{children}</div>
      </article>
    </Reveal>
  );
}

const INVOICE_LINES = [
  { code: "01-220", desc: "Lumber package", amt: "$4,120.00" },
  { code: "03-310", desc: "Concrete · slab", amt: "$2,890.50" },
  { code: "06-100", desc: "Framing labor", amt: "$3,480.00" },
  { code: "09-900", desc: "Paint · interior", amt: "$1,140.25" },
];

function InvoiceDemo() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const step = useStepper(INVOICE_LINES.length, inView, 550);
  return (
    <div ref={ref}>
      <div className="mono-label mb-3">coding 4 lines</div>
      <ul className="space-y-2">
        {INVOICE_LINES.map((l, i) => {
          const done = i < step;
          return (
            <li
              key={l.code}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 text-[12px]"
            >
              <span className="num shrink-0 text-ink-3">{l.code}</span>
              <span className="truncate text-ink-2">{l.desc}</span>
              <span className="num shrink-0 text-ink-2">{l.amt}</span>
              <span
                className={cn(
                  "num w-4 shrink-0 text-center transition-opacity duration-300",
                  done ? "text-ok opacity-100" : "opacity-25",
                )}
              >
                ✓
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BudgetDemo() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const pct = useCountUp(78, inView, 1400);
  const over = pct > 70;
  return (
    <div ref={ref}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <span className="mono-label truncate">Job 118 · framing budget</span>
        <span className={cn("num text-[12px]", over ? "text-crit" : "text-ink-2")}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-[6px] bg-surface-3">
        <div
          className={cn("h-full rounded-[6px] transition-colors", over ? "bg-crit" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={cn(
          "mt-4 flex flex-wrap items-center gap-2 transition-opacity duration-500",
          pct >= 77 ? "opacity-100" : "opacity-0",
        )}
      >
        <StatusPill tone="crit">PM notified</StatusPill>
        <span className="num text-[11px] text-ink-3">$14,208 over</span>
      </div>
    </div>
  );
}

const PHASE_ROWS = [
  { name: "Sitework", pct: 100 },
  { name: "Framing", pct: 82 },
  { name: "Mechanical", pct: 64 },
  { name: "Drywall", pct: 46 },
  { name: "Finishes", pct: 28 },
];

function PhaseDemo() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const step = useStepper(PHASE_ROWS.length, inView, 380);
  return (
    <div ref={ref}>
      <div className="mono-label mb-3">drafting phases · maple st.</div>
      <ul className="space-y-2.5">
        {PHASE_ROWS.map((p, i) => {
          const shown = i < step;
          return (
            <li key={p.name}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-ink-2">{p.name}</span>
                <span className="num text-ink-3">{shown ? `${p.pct}%` : "—"}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-[6px] bg-surface-3">
                <div
                  className="h-full rounded-[6px] bg-accent transition-[width] duration-700 ease-out"
                  style={{ width: shown ? `${p.pct}%` : "0%" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const CHECKS = [
  { label: "Bank feed reconciled", tone: "ok" as const, result: "OK" },
  { label: "Duplicate bills", tone: "ok" as const, result: "None" },
  { label: "Uncoded transactions", tone: "warn" as const, result: "3" },
  { label: "Job cost variance", tone: "ok" as const, result: "OK" },
  { label: "Payroll to hours", tone: "ok" as const, result: "Matched" },
];

function AuditDemo() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  const step = useStepper(CHECKS.length, inView, 420);
  return (
    <div ref={ref}>
      <div className="mono-label mb-3">nightly audit · 214 entries</div>
      <ul className="space-y-2">
        {CHECKS.map((c, i) => {
          const done = i < step;
          return (
            <li
              key={c.label}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[12px] transition-opacity duration-400",
                done ? "opacity-100" : "opacity-25",
              )}
            >
              <span className="truncate text-ink-2">{c.label}</span>
              <span
                className={cn("num shrink-0", c.tone === "warn" ? "text-warn" : "text-ok")}
              >
                {done ? c.result : "…"}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <StatusPill tone="warn">1 exception</StatusPill>
      </div>
    </div>
  );
}

export function Agents() {
  return (
    <Section id="agents" className="border-t border-line bg-surface-1">
      <SectionHeading
        eyebrow="Agents"
        title={
          <>
            Agents don't assist. <span className="text-accent">They do the work.</span>
          </>
        }
        sub="They run on your data every night and every hour. You read what they did, and step in when something needs a human."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <AgentCard
          name="invoice-agent"
          title="Codes the invoices"
          body="Reads every bill, splits it across jobs, assigns the cost code and posts it. You review the exceptions, not the stack."
        >
          <InvoiceDemo />
        </AgentCard>
        <AgentCard
          name="budget-agent"
          title="Watches the budgets"
          body="Tracks actuals against the estimate by phase. When a line runs hot, the PM hears about it that day, not at closeout."
        >
          <BudgetDemo />
        </AgentCard>
        <AgentCard
          name="phase-agent"
          title="Drafts the phases"
          body="Turns a new job into a working phase plan with durations and cost codes. Edit it, approve it, run it."
        >
          <PhaseDemo />
        </AgentCard>
        <AgentCard
          name="audit-agent"
          title="Audits the books nightly"
          body="Checks the ledger every night for duplicates, uncoded entries and payroll that doesn't match the hours."
        >
          <AuditDemo />
        </AgentCard>
      </div>
    </Section>
  );
}
