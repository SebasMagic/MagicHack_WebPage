import { Reveal, Section, SectionHeading } from "./primitives";

const CHIPS = [
  "Spreadsheets",
  "Text threads",
  "Whiteboard",
  "Paper tickets",
  "Email chains",
  "The guy who knows",
];

export function Problem() {
  return (
    <Section className="border-t border-line bg-surface-1">
      <SectionHeading
        eyebrow="The problem"
        title={
          <>
            Most construction companies run on twelve tools and a{" "}
            <span className="text-ink-3">group chat.</span>
          </>
        }
        sub="Numbers live in one place. Schedules in another. Hours on paper. Nobody agrees on what a job actually cost until it is over."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <ul className="flex flex-wrap gap-3">
          {CHIPS.map((c, i) => (
            <Reveal as="li" key={c} delay={i * 60}>
              <span className="inline-block rounded-[12px] border border-line bg-surface-2 px-4 py-3 text-[15px] text-ink-3 line-through decoration-crit decoration-2">
                {c}
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={120}>
          <div
            className="rounded-[12px] border border-line bg-surface-2 p-7"
            style={{ borderLeft: "3px solid var(--color-accent)" }}
          >
            <div className="mono-label">The answer</div>
            <h3 className="display mt-3 text-[30px] tracking-[2px]">One system instead</h3>
            <p className="mt-4 max-w-[52ch] text-[15px] text-ink-2">
              One place for the money, the jobs, the crew and the hours. Every cost code ties back
              to a job. Every hour ties back to a phase. You open one screen and you know where you
              stand.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
