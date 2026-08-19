import { useState } from "react";
import { ProductWindow } from "./ProductWindow";
import { PlatformModal } from "./PlatformModal";
import { RotatingWord } from "./RotatingWord";
import { ActionButton, LinkButton, Reveal } from "./primitives";

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 pt-32 pb-14 sm:px-8 lg:pt-28 lg:pb-10"
    >
      <div className="mx-auto grid w-full max-w-[1480px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.22fr] lg:gap-14">
        {/* left: text */}
        <div className="text-center lg:text-left">
          <Reveal>
            <div className="mono-label">One Stop Construction OS</div>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="display mt-6 text-[clamp(34px,6vw,58px)] leading-[0.98] tracking-[1px] lg:text-[clamp(46px,4.9vw,76px)]">
              <span className="block whitespace-nowrap">Run the whole</span>
              <span className="block whitespace-nowrap">company from</span>
              <span className="relative mt-1 inline-block text-accent">
                one screen.
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 h-[3px] w-full bg-accent"
                />
              </span>
            </h1>
            <div className="display mt-5 min-h-[1.1em] text-[clamp(22px,3vw,40px)] leading-none tracking-[1px] text-ink-2">
              <RotatingWord />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-[50ch] text-[17px] text-ink-2 lg:mx-0 lg:text-[19px]">
              Finance, projects, field and payroll in one system. AI agents handle the invoices,
              budgets and books in the background while you run the field.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <LinkButton href="#access">Request access</LinkButton>
              <ActionButton variant="ghost" onClick={() => setDemoOpen(true)}>
                See the platform
              </ActionButton>
            </div>

          </Reveal>
          <Reveal delay={240}>
            <p className="mt-6 flex items-center justify-center gap-2 text-[13px] text-ink-2 lg:justify-start">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" />
              Built inside a working construction company. Not a case study.
            </p>
          </Reveal>
        </div>

        {/* right: floating product window */}
        <div className="relative mx-auto w-full max-w-[760px] lg:max-w-full">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[8%] -bottom-16 h-56 rounded-[50%] blur-3xl"
            style={{ background: "rgba(244,124,47,0.34)" }}
          />
          <Reveal delay={120} className="relative">
            <ProductWindow tilt />
          </Reveal>
        </div>
      </div>

      <PlatformModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  );
}

