import { useEffect, useState } from "react";
import { StatusPill } from "./primitives";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/site-motion";

const VIEWS = ["Dashboard", "Bank Transactions", "Finance Audit", "Project Management", "Agents"] as const;
const AUTO_VIEWS: View[] = ["Dashboard", "Bank Transactions", "Finance Audit"];
type View = (typeof VIEWS)[number];

const NAV: { group: string; items: { label: string; view?: View }[] }[] = [
  {
    group: "Finance",
    items: [
      { label: "Dashboard", view: "Dashboard" },
      { label: "Bank Transactions", view: "Bank Transactions" },
      { label: "Finance Audit", view: "Finance Audit" },
      { label: "Bill Inbox" },
    ],
  },
  {
    group: "Project management",
    items: [{ label: "Project Management", view: "Project Management" }, { label: "Project Phases" }, { label: "Phase Planner AI", view: "Agents" }],
  },
  {
    group: "HR",
    items: [{ label: "Insightful" }, { label: "Payroll" }],
  },
];

const AUDIT = [
  { n: 1, name: "Bills Without Project", tone: "ok" as const },
  { n: 2, name: "Duplicate Bills", tone: "ok" as const },
  { n: 3, name: "Open Invoices", tone: "crit" as const, records: "10 records", amount: "$112,330.78" },
  { n: 4, name: "Future-Dated Bills", tone: "crit" as const, records: "1 record", amount: "$240.00" },
  { n: 5, name: "Suspicious Vendors", tone: "ok" as const },
  { n: 6, name: "Bills Unpaid 60+ Days", tone: "crit" as const, records: "44 records", amount: "$39,063.06" },
  { n: 7, name: "Bills Without CSI Code", tone: "crit" as const, records: "12 records", amount: "$12,713.09" },
  { n: 8, name: "Labor Expenses Without Project", tone: "warn" as const, records: "60 records", amount: "$69,862.62" },
  { n: 9, name: "Unapplied Vendor Credits", tone: "warn" as const, records: "11 records", amount: "$8,225.42" },
  { n: 10, name: "Projects: COGS > Income", tone: "crit" as const, records: "13 records", amount: "$580,564.08" },
];


const OVERVIEW_KPIS = [
  { label: "Movements This Month", value: "276", note: "Recorded in Jul 2026", tone: "ink" as const },
  { label: "Pending This Month", value: "70", note: "To reconcile in Jul 2026", tone: "accent" as const },
  { label: "Reconciled", value: "1,219", note: "Fully processed (all time)", tone: "ok" as const },
  { label: "Pending", value: "515", note: "Require attention (all time)", tone: "warn" as const },
  { label: "Active Projects", value: "65", note: "Currently tracking", tone: "ink" as const },
];

const RECON_SERIES = [
  82, 55, 25, 41, 68, 80, 73, 73, 62, 34, 58, 96, 84, 72, 88, 99, 86, 97, 78, 62,
  92, 99, 84, 96, 99, 2, 1, 1, 1, 1, 1,
];

const FINANCE_STRIP = [
  { label: "Movements", value: "1,978", note: "Rows in sheet", tone: "ink" as const },
  { label: "Reconciled", value: "1,443", note: "73.0% matched", tone: "ok" as const, pct: 73 },
  { label: "Pending", value: "535", note: "27.0% open", tone: "warn" as const, pct: 27 },
  { label: "Money In", value: "$2.61M", note: "All time", tone: "ok" as const },
  { label: "Money Out", value: "$2.42M", note: "All time", tone: "crit" as const },
];

const AUDIT_STRIP = [
  { label: "Checks Run", value: "11", note: "All time", tone: "ink" as const },
  { label: "Clean", value: "3", note: "No exceptions", tone: "ok" as const },
  { label: "Warning", value: "3", note: "Needs review", tone: "warn" as const },
  { label: "Critical", value: "5", note: "Fix this week", tone: "crit" as const },
  { label: "Exposure", value: "$823K", note: "Dollars at risk", tone: "accent" as const },
];

const PM_STRIP = [
  { label: "Active Projects", value: "65", note: "Currently tracking", tone: "ink" as const },
  { label: "On Track", value: "61", note: "Within budget", tone: "ok" as const },
  { label: "Flagged", value: "4", note: "Over budget", tone: "crit" as const },
  { label: "Avg Progress", value: "52%", note: "Across phases", tone: "accent" as const, pct: 52 },
  { label: "Phases Open", value: "138", note: "Scheduled", tone: "ink" as const },
];

const AGENTS_STRIP = [
  { label: "Tasks Tonight", value: "240", note: "Completed by agents", tone: "ok" as const },
  { label: "Invoices Coded", value: "12", note: "Matched to jobs", tone: "ink" as const },
  { label: "Budgets Watched", value: "65", note: "Jobs monitored", tone: "accent" as const },
  { label: "Exceptions", value: "1", note: "Sent to admin", tone: "warn" as const },
  { label: "Hours Saved", value: "6.4", note: "Last 24 hours", tone: "ink" as const },
];

const ROWS = [
  { date: "30/07", desc: "Home Depot Atlanta GA", inst: "American Expr…", acct: "1005", amt: "-$249.56", vendor: "Home Depot", project: "—", tone: "muted" as const },
  { date: "30/07", desc: "Check Image 1056", inst: "Bank of America", acct: "6914", amt: "-$700.00", vendor: "—", project: "—", tone: "muted" as const },
  { date: "29/07", desc: "Home Depot Atlanta GA", inst: "American Expr…", acct: "1005", amt: "-$67.96", vendor: "Home Depot", project: "Peterson Reno", tone: "ok" as const },
  { date: "29/07", desc: "Bestfit Home & F Des:sale", inst: "Bank of America", acct: "6914", amt: "-$1,856.24", vendor: "—", project: "Izquierdo Bsmt", tone: "ok" as const },
  { date: "29/07", desc: "Ridgeview draw #4", inst: "Bank of America", acct: "2687", amt: "+$48,905.12", vendor: "—", project: "Ridgeview Build", tone: "ok" as const },
];

const PHASES = [
  { name: "Sitework", pct: 100, tone: "ok" as const },
  { name: "Framing", pct: 78, tone: "crit" as const, note: "Over budget" },
  { name: "Mechanical", pct: 54, tone: "accent" as const },
  { name: "Drywall", pct: 22, tone: "muted" as const },
  { name: "Finishes", pct: 6, tone: "muted" as const },
];

const LOG = [
  "06:04:12  invoice-agent   read 12 invoices → coded 12 ✓",
  "06:11:38  budget-agent    job 118 framing 78% of budget → flagged",
  "06:19:02  phase-agent     drafted 5 phases · Maple St. Remodel",
  "06:24:47  audit-agent     214 entries checked · 1 exception",
  "06:31:20  field-agent     9 clock-ins matched to cost codes ✓",
];

const barColor: Record<string, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  crit: "bg-crit",
  accent: "bg-accent",
  muted: "bg-line-strong",
};

const textColor: Record<string, string> = {
  ok: "text-ok",
  warn: "text-warn",
  crit: "text-crit",
  accent: "text-accent",
  muted: "text-ink-2",
  ink: "text-ink",
};

export function ProductWindow({
  tilt = false,
  fullscreen = false,
  onClose,
}: {
  tilt?: boolean;
  fullscreen?: boolean;
  onClose?: () => void;
}) {
  const [view, setView] = useState<View>("Dashboard");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      setView((v) => {
        const i = AUTO_VIEWS.indexOf(v);
        return (AUTO_VIEWS[i === -1 ? 0 : (i + 1) % AUTO_VIEWS.length] as View);
      });
    }, 3500);
    return () => window.clearInterval(id);
  }, [auto]);

  const pick = (v: View) => {
    setView(v);
    setAuto(false);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[12px] border-2 border-accent bg-surface-1",
        fullscreen && "flex h-full flex-col",
        tilt && "[transform:perspective(1800px)_rotateX(7deg)]",
      )}
    >
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-0 px-4 py-2.5">
        <div aria-hidden className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <div className="mono-label hidden sm:block">onestop.os / atlanta, ga</div>
        <div className="ml-auto flex items-center gap-3">
          <StatusPill tone="ok" pulse>
            Live
          </StatusPill>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close platform demo"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] border border-line-strong bg-surface-2 text-[14px] text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)]",
          fullscreen && "min-h-0 flex-1 sm:grid-cols-[190px_minmax(0,1fr)]",
        )}
      >
        {/* sidebar */}
        <nav
          aria-label="App sections"
          className="hidden border-r border-line bg-surface-0 py-3 sm:block"
        >
          {NAV.map((g) => (
            <div key={g.group} className="mb-4">
              <div className="mono-label px-4 pb-2">{g.group}</div>
              <ul>
                {g.items.map((it) => {
                  const active = it.view === view;
                  return (
                    <li key={it.label}>
                      <button
                        type="button"
                        onClick={() => (it.view ? pick(it.view) : undefined)}
                        className={cn(
                          "flex w-full items-center gap-2 border-l-2 px-4 py-1.5 text-left text-[12.5px] transition-colors",
                          active
                            ? "border-accent bg-surface-2 text-accent"
                            : "border-transparent text-ink-2 hover:text-ink",
                        )}
                      >
                        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-current opacity-60" />
                        <span className="truncate">{it.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* mobile view switch */}
        <div className="flex gap-1 overflow-x-auto border-b border-line bg-surface-0 px-2 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => pick(v)}
              className={cn(
                "display shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] tracking-[1.5px] transition-colors",
                view === v ? "border-accent text-ink" : "border-transparent text-ink-3",
              )}

            >
              {v}
            </button>
          ))}
        </div>

        {/* main panel */}
        <div className={cn("min-w-0 min-h-[380px] bg-surface-1", fullscreen && "min-h-0 overflow-y-auto")}>
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <h3 className="display truncate text-[19px] tracking-[2px]">
                {view === "Dashboard" ? "Overview" : view}
              </h3>
              <p className="mono-label mt-1 hidden truncate normal-case md:block">
                {view === "Dashboard"
                  ? "Welcome back, Carlos Trujillo. Here's what's happening."
                  : view === "Bank Transactions"
                    ? "Every movement, matched to a job."
                    : view === "Finance Audit"
                      ? "11 data-quality checks — all time."
                      : view === "Project Management"
                        ? "Phases, budget and progress by job."
                        : "What the agents did overnight."}
              </p>
            </div>
            <div className="hidden shrink-0 gap-2 md:flex">
              {view === "Dashboard" ? (
                <>
                  <span className="rounded-[6px] border border-line-strong bg-surface-2 px-2.5 py-1.5 font-mono text-[10px] tracking-[1.5px] text-ink uppercase">
                    Open Project Management
                  </span>
                  <span className="rounded-[6px] border border-accent bg-accent px-2.5 py-1.5 font-mono text-[10px] tracking-[1.5px] text-surface-0 uppercase">
                    Open Bank Transactions
                  </span>
                </>
              ) : (
                (view === "Finance Audit" ? ["All time", "This month", "Custom"] : ["Export", "Sync", "Refresh"]).map((b) => (
                  <span
                    key={b}
                    className="rounded-[6px] border border-line-strong bg-surface-2 px-2.5 py-1.5 font-mono text-[10px] tracking-[1.5px] text-ink-2 uppercase"
                  >
                    {b}
                  </span>
                ))
              )}
            </div>
          </header>

          <div className="p-4">
            {view === "Dashboard" ? <OverviewView /> : null}
            {view === "Bank Transactions" ? <FinanceView /> : null}
            {view === "Finance Audit" ? <AuditView /> : null}
            {view === "Project Management" ? <ProjectsView /> : null}
            {view === "Agents" ? <AgentsView /> : null}
          </div>


        </div>
      </div>
    </div>
  );
}

type StripItem = {
  label: string;
  value: string;
  note: string;
  tone: keyof typeof textColor;
  pct?: number;
};

function Strip({ items }: { items: StripItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((k) => (
        <div key={k.label} className="min-w-0 rounded-[12px] border border-line bg-surface-2 p-2">
          <div className="mono-label truncate text-[9px] tracking-[1px]">{k.label}</div>
          <div className={cn("num mt-1 truncate text-[clamp(13px,1.5vw,17px)]", textColor[k.tone])}>
            {k.value}
          </div>
          <div className="mt-0.5 truncate text-[9px] text-ink-3">{k.note}</div>
          {typeof k.pct === "number" ? (
            <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-[6px] bg-surface-3">
              <div
                className={cn("h-full rounded-[6px] transition-[width] duration-700", barColor[k.tone] ?? "bg-accent")}
                style={{ width: `${k.pct}%` }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-[12px] border border-line bg-surface-2 p-3", className)}>
      <div className="display text-[13px] tracking-[2px]">{title}</div>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function ViewShell({ items, children }: { items: StripItem[]; children: React.ReactNode }) {
  return (
    <div className="animate-[fade-in_0.35s_ease-out]">
      <Strip items={items} />
      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-[1.4fr_1fr]">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: keyof typeof textColor;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
      <span className="min-w-0 truncate text-[11.5px] text-ink-2">{label}</span>
      <span className={cn("num shrink-0 text-[12px]", textColor[tone])}>{value}</span>
    </div>
  );
}

function OverviewView() {
  const w = 300;
  const h = 92;
  const pts = RECON_SERIES.map((v, i) => {
    const x = (i / (RECON_SERIES.length - 1)) * w;
    const y = h - (v / 100) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <ViewShell items={OVERVIEW_KPIS}>
      <Panel title="Reconciliation progress">
        <div className="flex gap-2">
          <div className="flex flex-col justify-between py-[2px] font-mono text-[8px] text-ink-3">
            {["100%", "75%", "50%", "25%", "0%"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <svg
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            className="h-[92px] w-full"
            role="img"
            aria-label="Reconciliation progress over the month"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <line
                key={g}
                x1="0"
                x2={w}
                y1={g * h}
                y2={g * h}
                stroke="currentColor"
                strokeDasharray="2 3"
                strokeWidth="0.5"
                className="text-line-strong"
              />
            ))}
            <polyline
              points={pts}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="text-accent"
            />
          </svg>
        </div>
        <div className="mt-1 flex justify-between font-mono text-[8px] text-ink-3">
          {["Jul 3", "Jul 9", "Jul 15", "Jul 21", "Jul 26", "Jul 31"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </Panel>

      <Panel title="Financial summary">
        <SummaryRow label="Total Income (Jul 2026)" value="$989,059.27" tone="ok" />
        <SummaryRow label="Total Expenses (Jul 2026)" value="$632,741.84" tone="crit" />
        <SummaryRow label="Net (Jul 2026)" value="$356,317.43" tone="accent" />
        <SummaryRow label="Open bills" value="$112,330.78" tone="warn" />
      </Panel>
    </ViewShell>
  );
}

function FinanceView() {
  return (
    <ViewShell items={FINANCE_STRIP}>
      <Panel title="Recent movements" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-0 text-left">
            <thead>
              <tr className="mono-label border-b border-line">
                <th className="py-1.5 pr-2 font-normal">Date</th>
                <th className="py-1.5 pr-2 font-normal">Description</th>
                <th className="py-1.5 pr-2 text-right font-normal">Amount</th>
                <th className="py-1.5 font-normal">Project</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.desc + r.amt} className="border-b border-line last:border-0">
                  <td className="num py-1.5 pr-2 text-[10px] text-ink-3">{r.date}</td>
                  <td className="py-1.5 pr-2 text-[11.5px]">
                    <span className="block truncate">{r.desc}</span>
                    <span className="mono-label text-[8px]">{r.inst}</span>
                  </td>
                  <td
                    className={cn(
                      "num py-1.5 pr-2 text-right text-[11px]",
                      r.amt.startsWith("+") ? "text-ok" : "text-crit",
                    )}
                  >
                    {r.amt}
                  </td>
                  <td className="py-1.5">
                    {r.project === "—" ? (
                      <span className="text-[11px] text-ink-3">—</span>
                    ) : (
                      <span className="inline-block max-w-[92px] truncate rounded-[6px] border border-line bg-surface-0 px-2 py-0.5 font-mono text-[9px] text-ok">
                        {r.project}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Money flow">
        <SummaryRow label="Money in (all time)" value="$2,619,887" tone="ok" />
        <SummaryRow label="Money out (all time)" value="$2,429,544" tone="crit" />
        <SummaryRow label="Net position" value="$190,342.85" tone="accent" />
        <SummaryRow label="Unmatched rows" value="535" tone="warn" />
      </Panel>
    </ViewShell>
  );
}

function AuditView() {
  return (
    <ViewShell items={AUDIT_STRIP}>
      <Panel title="Data-quality checks">
        <ul className="space-y-1">
          {AUDIT.map((a) => (
            <li
              key={a.n}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-1.5 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", barColor[a.tone])} />
                <span className="num text-[9px] text-ink-3">#{a.n}</span>
                <span className="truncate text-[11.5px]">{a.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {a.records ? (
                  <>
                    <span
                      className={cn(
                        "hidden rounded-[6px] px-1.5 py-0.5 font-mono text-[9px] sm:inline-block",
                        a.tone === "crit" ? "bg-crit/20 text-crit" : "bg-surface-3 text-ink-2",
                      )}
                    >
                      {a.records}
                    </span>
                    <span className="num text-[11px] text-ink-2">{a.amount}</span>
                  </>
                ) : (
                  <span className="text-[11px] text-ok">Clean</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Exposure">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <StatusPill tone="ok">3 Clean</StatusPill>
          <StatusPill tone="warn">3 Warning</StatusPill>
          <StatusPill tone="crit">5 Critical</StatusPill>
        </div>
        <SummaryRow label="Critical exposure" value="$744,911.01" tone="crit" />
        <SummaryRow label="Warning exposure" value="$78,088.04" tone="warn" />
        <SummaryRow label="Checks run" value="11" tone="ink" />
      </Panel>
    </ViewShell>
  );
}

function ProjectsView() {
  return (
    <ViewShell items={PM_STRIP}>
      <Panel title="Phase progress">
        <div className="space-y-2">
          {PHASES.map((p) => (
            <div key={p.name}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-[11.5px]">{p.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {p.note ? <span className="font-mono text-[9px] text-crit uppercase">{p.note}</span> : null}
                  <span className="num text-[11px] text-ink-2">{p.pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-[6px] bg-surface-3">
                <div
                  className={cn("h-full rounded-[6px] transition-[width] duration-700", barColor[p.tone])}
                  style={{ width: `${p.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Budget watch">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <StatusPill tone="crit">Flagged</StatusPill>
        </div>
        <SummaryRow label="Framing over budget" value="$14,208" tone="crit" />
        <SummaryRow label="Committed cost" value="$1,204,880" tone="ink" />
        <SummaryRow label="Remaining budget" value="$318,442" tone="ok" />
        <SummaryRow label="Jobs on track" value="61 of 65" tone="accent" />
      </Panel>
    </ViewShell>
  );
}

function AgentsView() {
  return (
    <ViewShell items={AGENTS_STRIP}>
      <Panel title="Agent log · live">
        <ul className="space-y-1.5">
          {LOG.map((l) => (
            <li key={l} className="num text-[10.5px] leading-5 break-words text-ink-2">
              <span className="text-ok">●</span> {l}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Overnight totals">
        <SummaryRow label="Tasks completed" value="240" tone="ok" />
        <SummaryRow label="Invoices coded" value="12" tone="accent" />
        <SummaryRow label="Exceptions raised" value="1" tone="warn" />
        <SummaryRow label="Hours saved" value="6.4" tone="ink" />
      </Panel>
    </ViewShell>
  );
}

