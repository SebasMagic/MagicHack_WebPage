import { useEffect } from "react";
import { ProductWindow } from "./ProductWindow";

export function PlatformModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Platform demo"
      className="fixed inset-0 z-[100] flex flex-col bg-surface-0/95 p-2 backdrop-blur-sm sm:p-4"
    >
      <div className="min-h-0 flex-1">
        <ProductWindow fullscreen onClose={onClose} />
      </div>
    </div>
  );
}
