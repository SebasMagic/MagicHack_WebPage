const FEED = [
  "06:04 invoice · read 12 invoices → coded ✓",
  "06:11 budget · Job 118 framing at 78% → PM notified",
  "06:19 phase · drafted 5 phases for Maple St. remodel",
  "06:24 audit · 214 entries checked · 1 exception",
  "06:31 field · 9 crew clock-ins matched to cost codes ✓",
  "06:40 invoice · vendor bill split across 3 jobs ✓",
  "06:52 payroll · hours reconciled for 27 people ✓",
];

export function LiveStrip() {
  const line = FEED.join("   ·   ");
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-8 overflow-hidden bg-accent text-white">
      <div className="flex h-full items-center">
        <span className="z-10 flex h-full shrink-0 items-center gap-2 bg-accent pr-4 pl-4 font-mono text-[10px] font-bold tracking-[1.5px] uppercase sm:pl-6">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-white"
            style={{ animation: "dot-pulse 1.6s ease-in-out infinite" }}
          />
          Live ops
        </span>
        <div className="relative flex-1 overflow-hidden" aria-hidden>
          <div
            className="flex w-max whitespace-nowrap will-change-transform"
            style={{ animation: "marquee-x 46s linear infinite" }}
          >
            <span className="px-4 font-mono text-[11px] tracking-[1px]">{line}</span>
            <span className="px-4 font-mono text-[11px] tracking-[1px]">{line}</span>
          </div>
        </div>
      </div>
      <span className="sr-only">Live agent activity feed: {line}</span>
    </div>
  );
}
