"use client";

import { BRAND } from "@/lib/constants";

export default function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-sm text-left w-full"
      style={
        active
          ? { background: BRAND.teal, color: BRAND.navy, fontWeight: 600 }
          : { background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }
      }
    >
      {children}
    </button>
  );
}
