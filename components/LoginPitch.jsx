import { BRAND } from "@/lib/constants";
import LogoMark from "@/components/LogoMark";
import AppDemo from "@/components/AppDemo";

const INSTAGRAM_URL = "https://www.instagram.com/tu_equipo.ia/";

// lucide-react no incluye íconos de marcas (Instagram) por lineamientos de
// licencia de los logos — se dibuja acá como SVG simple.
function InstagramIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

// Presentación de marca para el login: quiénes somos + demo animada de la app.
export default function LoginPitch() {
  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: BRAND.teal }}>
          <LogoMark size={30} color="#ffffff" />
        </div>
        <span style={{ color: BRAND.cream }} className="text-lg tracking-widest uppercase font-semibold">Tu Equipo IA</span>
      </div>

      <p style={{ color: BRAND.cream }} className="text-lg font-medium leading-snug mb-3">
        Suscripción mensual para emprendedores que recién arrancan.
      </p>
      <p style={{ color: "#a8a8bc" }} className="text-sm leading-relaxed mb-6">
        Cada semana recibís herramientas, información actualizada y guía práctica para construir tu identidad, comunicarte
        mejor y hacer crecer tu negocio — sin marearte, sin gastar en 50 cursos, sin necesitar un equipo propio.
      </p>

      <AppDemo />

      <div className="mt-7 pt-6" style={{ borderTop: "1px solid #242440" }}>
        <p style={{ color: BRAND.cream }} className="text-sm font-medium mb-1">
          ¿Le das el primer paso a tu negocio? Suscribite y empezá esta semana.
        </p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 text-xs font-medium hover:opacity-80" style={{ color: BRAND.teal }}>
          <InstagramIcon size={14} /> Seguinos en Instagram @tu_equipo.ia
        </a>
      </div>
    </div>
  );
}
