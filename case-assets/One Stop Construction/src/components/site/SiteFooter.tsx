import iconUrl from "@/assets/logo-tower.png";
import wordmarkUrl from "@/assets/logo-header.png";



const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "#platform" },
      { label: "Agents", href: "#agents" },
      { label: "Integrations", href: "#integrations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Who we are", href: "#company" },
      { label: "Get access", href: "#access" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface-0 px-5 py-14 sm:px-8">
      <div className="mx-auto grid w-full max-w-[1360px] gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={iconUrl} alt="" aria-hidden width={32} height={32} loading="lazy" className="h-8 w-8" />
            <img
              src={wordmarkUrl}
              alt="One Stop"
              width={718}
              height={134}
              loading="lazy"
              className="h-6 w-auto"
            />
          </div>
          <p className="mt-4 max-w-[44ch] text-[14px] text-ink-2">
            The operating system for construction companies. Built on a jobsite, not in a lab.
          </p>
        </div>

        {COLUMNS.map((c) => (
          <div key={c.title}>
            <div className="mono-label">{c.title}</div>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-[14px] text-ink-2 transition-colors hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 w-full max-w-[1360px] border-t border-line pt-6">
        <p className="num text-[11px] text-ink-3">
          © 2026 One Stop Design &amp; Build — Atlanta, GA
        </p>
      </div>
    </footer>
  );
}
