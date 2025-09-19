"use client";

import { useState } from "react";

/**
 * Toggle visual de tema. Não persiste nada por enquanto.
 * Mantém estilo minimalista, sem afetar o restante do header.
 */
export default function ThemeToggle() {
  const [on, setOn] = useState(false);

  return (
    <div
      className="flex items-center gap-3 rounded-full px-3 py-1.5 ring-1 ring-black/5"
      title="Alternar tema (visual)"
    >
      <span className="text-[14px] font-medium text-black">Tema</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          on ? "bg-[#A94DFF]" : "bg-black/10",
          "outline-none focus-visible:ring-2 focus-visible:ring-[#A94DFF]",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            on ? "translate-x-[22px]" : "translate-x-[2px]",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
