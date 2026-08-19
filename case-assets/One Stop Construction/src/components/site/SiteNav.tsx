import { useEffect, useState } from "react";
import iconUrl from "@/assets/logo-tower.png";
import wordmarkUrl from "@/assets/logo-header.png";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Agents", href: "#agents" },
  { label: "Integrations", href: "#integrations" },
  { label: "Company", href: "#company" },
];

export function SiteNav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-8 z-40 transition-colors duration-300",
        solid ? "border-b border-line bg-surface-0/95 backdrop-blur" : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-[1360px] items-center gap-4 px-5 sm:px-8"
      >
        <a href="#top" className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <img
            src={iconUrl}
            alt=""
            aria-hidden
            width={42}
            height={42}
            className={cn(
              "h-8 w-8 shrink-0 transition-transform duration-300 sm:h-10 sm:w-10",
              solid && "motion-safe:scale-110",
            )}
          />
          <img
            src={wordmarkUrl}
            alt="One Stop"
            width={718}
            height={134}
            className={cn(
              "h-6 w-auto min-w-0 max-w-full transition-all duration-300 sm:h-8",
              solid &&
                "motion-safe:scale-[1.04] motion-safe:[filter:brightness(0)_saturate(100%)_invert(45%)_sepia(80%)_saturate(5000%)_hue-rotate(10deg)_brightness(1.1)]",
            )}
          />
        </a>

        <ul className="ml-6 hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-[14px] text-ink-2 transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <a
            href="#access"
            className="display hidden rounded-[12px] bg-accent px-5 py-2.5 text-[16px] tracking-[3px] text-white transition-colors duration-150 hover:bg-accent-hover active:scale-[0.98] sm:block"
          >
            Get access
          </a>

          <button
            type="button"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] border border-line text-ink-2 md:hidden"
          >
            <span aria-hidden className="text-lg leading-none">
              {open ? "×" : "≡"}
            </span>
          </button>
        </div>
      </nav>

      {open ? (
        <ul className="border-t border-line bg-surface-0 px-5 pb-4 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-line py-3 text-[15px] text-ink-2"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="pt-4">
            <a
              href="#access"
              onClick={() => setOpen(false)}
              className="display block rounded-[12px] bg-accent px-5 py-3 text-center text-[16px] tracking-[3px] text-white"
            >
              Get access
            </a>
          </li>
        </ul>

      ) : null}
    </header>
  );
}
