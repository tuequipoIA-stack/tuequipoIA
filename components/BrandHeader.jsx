import { BRAND } from "@/lib/constants";
import LogoMark from "@/components/LogoMark";

// Encabezado de marca reutilizable (login, signup, onboarding, suscripción...).
// variant="inline" (default): logo chico al lado del nombre, como antes.
// variant="stacked": logo grande, con el nombre debajo (usado en el login).
export default function BrandHeader({ className = "mb-8", variant = "inline" }) {
  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0" style={{ background: BRAND.teal }}>
          <LogoMark size={46} color="#ffffff" />
        </div>
        <span style={{ color: BRAND.cream }} className="text-xl tracking-widest uppercase font-semibold">Tu Equipo IA</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 justify-center ${className}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: BRAND.teal }}>
        <LogoMark size={21} color="#ffffff" />
      </div>
      <span style={{ color: BRAND.cream }} className="text-sm tracking-widest uppercase font-semibold">Tu Equipo IA</span>
    </div>
  );
}
