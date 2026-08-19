import jobsite from "@/assets/jobsite.jpg";
import { Reveal, Section } from "./primitives";

export function Company() {
  return (
    <Section id="company" className="border-t border-line bg-surface-1">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <Reveal>
            <div className="mono-label">The company</div>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="display mt-4 text-[clamp(34px,5.4vw,60px)] tracking-[2px]">
              We didn't learn construction from a{" "}
              <span className="text-accent">case study.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-6 max-w-[56ch] space-y-4 text-[16px] text-ink-2">
              <p>
                One Stop Design &amp; Build is a construction company in Atlanta. We built this
                system for ourselves because nothing on the market handled the money and the
                jobsite in the same place.
              </p>
              <p>
                It ran our own jobs, our own payroll and our own books before it was ever sold to
                anyone. Every screen exists because somebody here needed it on a Tuesday morning.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="relative overflow-hidden rounded-[12px] border border-line-strong">
            <img
              src={jobsite}
              alt="Two builders in hard hats reviewing plans in front of a wood-framed house under construction"
              width={1600}
              height={1104}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 mix-blend-color"
              style={{ background: "#112240" }}
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(9,22,40,0.55) 0%, rgba(9,22,40,0.82) 100%)",
              }}
            />
            <div className="absolute bottom-4 left-4">
              <span className="mono-label text-ink-2">Atlanta, GA · our own jobsite</span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
