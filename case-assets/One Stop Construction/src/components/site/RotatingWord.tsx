import { useEffect, useState } from "react";

const WORDS = ["finance.", "agents.", "project management.", "payroll.", "accounting."];

export function RotatingWord() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let swapTimer = 0;
    const id = window.setInterval(() => {
      setShow(false);
      swapTimer = window.setTimeout(() => {
        setI((n) => (n + 1) % WORDS.length);
        setShow(true);
      }, 260);
    }, 2400);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(swapTimer);
    };
  }, []);

  return (
    <span className="relative inline-block align-baseline">
      <span
        className="inline-block transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(0.22em)",
        }}
      >
        {WORDS[i]}
      </span>
    </span>
  );
}
