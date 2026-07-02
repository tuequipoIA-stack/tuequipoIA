"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { BRAND } from "@/lib/constants";

// Input de contraseña con botón para mostrar/ocultar lo que se escribe.
export default function PasswordInput({ value, onChange, placeholder, required, minLength, className, style, dark = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className || "w-full rounded-lg px-4 py-3 pr-11 text-sm outline-none"}
        style={style || (dark
          ? { background: "#242440", color: BRAND.cream, border: "1px solid #35354f" }
          : { border: "1px solid #e4dfd3" })}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full px-3 flex items-center"
        style={{ color: dark ? "#8b8b9a" : "#a89f88" }}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
