"use client";

import { AGENTS, BRAND } from "@/lib/constants";

export default function AgentGrid({ onPick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {AGENTS.map((a) => {
        const Icon = a.icon;
        return (
          <button key={a.id} onClick={() => onPick(a)}
            className="text-left rounded-xl p-5 transition-transform hover:-translate-y-0.5"
            style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: a.color }}>
              <Icon size={20} color={a.id === "marketing" ? BRAND.navy : BRAND.cream} />
            </div>
            <div style={{ color: BRAND.navy }} className="font-semibold mb-0.5">{a.name} · {a.rol}</div>
            <div style={{ color: "#6b6759" }} className="text-sm">{a.tagline}</div>
          </button>
        );
      })}
    </div>
  );
}
