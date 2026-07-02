import { BRAND } from "@/lib/constants";
import LogoMark from "@/components/LogoMark";

// Encabezado de marca reutilizable (login, signup, onboarding, suscripción...).
export default function BrandHeader({ className = "mb-8" }) {
  return (
    <div className={`flex items-center gap-2.5 justify-center ${className}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: BRAND.teal }}>
        <LogoMark size={21} color="#ffffff" />
      </div>
      <span style={{ color: BRAND.cream }} className="text-sm tracking-widest uppercase font-semibold">Tu Equipo IA</span>
    </div>
  );
}
