import { Calendar, Compass, Megaphone, Palette, TrendingUp } from "lucide-react";
import { BRAND } from "@/lib/constants";
import LogoMark from "@/components/LogoMark";

const INCLUYE = [
  { icon: Compass, titulo: "Arrancá", texto: "De la idea al primer paso concreto." },
  { icon: Palette, titulo: "Tu identidad", texto: "Colores, logo, voz de marca." },
  { icon: Megaphone, titulo: "Qué comunicar", texto: "Qué subir, qué decir, cómo mostrarte." },
  { icon: Calendar, titulo: "Tu calendario", texto: "Contenido planificado semana a semana." },
  { icon: TrendingUp, titulo: "Más ventas", texto: "Estrategias prácticas para crecer." },
];

// Presentación de marca para el login: quiénes somos y qué incluye la suscripción.
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
      <p style={{ color: "#a8a8bc" }} className="text-sm leading-relaxed mb-8">
        Cada semana recibís herramientas, información actualizada y guía práctica para construir tu identidad, comunicarte
        mejor y hacer crecer tu negocio — sin marearte, sin gastar en 50 cursos, sin necesitar un equipo propio.
      </p>

      <div className="space-y-4">
        {INCLUYE.map((item) => (
          <div key={item.titulo} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#242440" }}>
              <item.icon size={15} color={BRAND.teal} />
            </div>
            <div>
              <div style={{ color: BRAND.cream }} className="text-sm font-semibold">{item.titulo}</div>
              <div style={{ color: "#8b8b9a" }} className="text-xs">{item.texto}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
