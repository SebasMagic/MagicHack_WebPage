import { useState, type FormEvent } from "react";
import { z } from "zod";
import { ActionButton, Reveal, Section, StatusPill } from "./primitives";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Enter your email address." })
    .email({ message: "That email doesn't look right." })
    .max(255, { message: "That email is too long." }),
});

export function CloseCta() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setError(null);
    setDone(true);
  };

  return (
    <Section id="access" className="border-t border-line bg-surface-0">
      <div className="mx-auto max-w-[720px] text-center">
        <Reveal>
          <div className="mono-label">Early access</div>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="display mt-4 text-[clamp(36px,6vw,68px)] tracking-[2px]">
            Get on the <span className="text-accent">list.</span>
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-5 max-w-[52ch] text-[16px] text-ink-2">
            Leave your email. We'll show you the system running on real jobs and set you up if it
            fits.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-9" aria-live="polite">
            {done ? (
              <div
                className="mx-auto max-w-[520px] rounded-[12px] border border-line bg-surface-2 p-6"
                style={{ borderLeft: "3px solid var(--color-ok)" }}
              >
                <StatusPill tone="ok">Received</StatusPill>
                <p className="mt-3 text-[16px]">
                  Got it. We'll be in touch within one business day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                noValidate
                className="mx-auto flex max-w-[560px] flex-col gap-3 sm:flex-row"
              >
                <label htmlFor="email" className="sr-only">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? "email-error" : undefined}
                  className="h-[54px] flex-1 rounded-[12px] border border-line bg-surface-2 px-4 text-[15px] text-ink placeholder:text-ink-3"
                />
                <ActionButton type="submit" className="h-[54px] py-0">
                  Request access
                </ActionButton>
              </form>
            )}
            {error ? (
              <p id="email-error" className="mt-3 text-[13px] text-crit">
                {error}
              </p>
            ) : null}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
