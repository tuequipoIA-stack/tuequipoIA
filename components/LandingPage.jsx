import Link from "next/link";
import { BRAND, WHATSAPP_LINK, EMAIL_CONTACTO } from "@/lib/constants";

const INSTAGRAM_URL = "https://www.instagram.com/tu_equipo.ia/";

const FEATURES_PORTAL = [
  { letra: "M", titulo: "Marketing con guía", texto: "Dejá de improvisar publicaciones a las apuradas: sabé qué publicar cada semana, sin gastar tu cabeza en eso." },
  { letra: "V", titulo: "Ventas ordenadas", texto: "Que ningún cliente se pierda por no anotarlo a tiempo, y que cerrar una venta no dependa de tu memoria." },
  { letra: "O", titulo: "Oferta y precio", texto: "Cobrá lo que tenés que cobrar, con la tranquilidad de que no estás perdiendo plata sin saberlo." },
  { letra: "E", titulo: "Estrategia y foco", texto: "Un plan bajado a lo de hoy y esta semana, para no llegar a fin de mes preguntándote qué lograste." },
  { letra: "$", titulo: "Finanzas claras", texto: "Mirá tu plata de un vistazo, sin abrir tres planillas ni asustarte a fin de mes." },
  { letra: "+", titulo: "Tablero de tareas", texto: "Organizá la semana de tu equipo para que las cosas se hagan, aunque vos no estés arriba de cada una." },
];

const SERVICIOS_SOFTWARE = [
  { num: "01", titulo: "Portales B2B", texto: "Que tus clientes o proveedores se manejen solos, sin que cada pedido pase por vos." },
  { num: "02", titulo: "Dashboards", texto: "Decisiones con datos reales, no con lo que \"te parece\" a las apuradas." },
  { num: "03", titulo: "Sistemas de turnos", texto: "Se acabó el ida y vuelta por WhatsApp para coordinar una agenda." },
  { num: "04", titulo: "Automatizaciones con IA", texto: "Lo repetitivo lo hace el sistema, para que tu gente piense en lo que de verdad importa." },
];

const PASOS_PROCESO = [
  { num: "01", titulo: "Relevamiento", texto: "Entendemos tu proceso real, tus clientes y qué te está frenando hoy." },
  { num: "02", titulo: "Propuesta", texto: "Definimos alcance, prioridades y una hoja de ruta realista, sin cotizar a ciegas." },
  { num: "03", titulo: "Desarrollo", texto: "Construimos por etapas, mostrando avances para validar que vamos por el camino correcto." },
  { num: "04", titulo: "Acompañamiento", texto: "Soporte, mejoras y evolución del sistema una vez que ya está en producción." },
];

const MANIFIESTO = [
  { titulo: "Simplificar", texto: "Ordenar lo que hoy depende de tu memoria, para que un día libre no signifique que todo se frena." },
  { titulo: "Escalar", texto: "Sistemas pensados para crecer con vos, no para que crecer signifique trabajar el doble." },
  { titulo: "Acompañar", texto: "Un equipo técnico real detrás, para que nunca estés solo/a resolviendo esto." },
];

function IconBadge({ size = 34, radius = 10 }) {
  return (
    <div
      style={{ width: size, height: size, borderRadius: radius, background: BRAND.teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-icono-tuequipo.svg" alt="Tu Equipo IA" style={{ width: size * 0.56, height: size * 0.56 }} />
    </div>
  );
}

function Wordmark({ height = 22 }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-texto-tuequipo.svg" alt="Tu Equipo IA" style={{ height, width: "auto" }} />;
}

function NumBadge({ n }) {
  return (
    <div className="inline-flex items-center gap-3 mb-5">
      <span
        className="flex items-center justify-center shrink-0 font-extrabold text-[15px]"
        style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, #22c3c1, ${BRAND.teal})`, color: "#fff", boxShadow: "0 6px 16px rgba(26,171,170,0.35)" }}
      >
        {n}
      </span>
      <span className="text-[13.5px] font-bold uppercase tracking-wide" style={{ color: "#12807f" }}>
        {n === "1" ? "Portal para emprendedores · Membresías" : "Software a Medida · Desarrollo"}
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: BRAND.cream, color: BRAND.navy }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        .landing-tuequipoia h1, .landing-tuequipoia h2, .landing-tuequipoia h3,
        .landing-tuequipoia h4, .landing-tuequipoia h5, .landing-tuequipoia h6 {
          font-family: 'Sora', -apple-system, sans-serif;
          letter-spacing: -0.01em;
        }
      `}</style>
      <div className="landing-tuequipoia">
      {/* NAV */}
      <nav className="sticky top-0 z-50" style={{ background: BRAND.navy, borderBottom: "1px solid #2a2a45" }}>
        <div className="max-w-[1180px] mx-auto px-6 flex items-center justify-between py-3.5">
          <div className="flex items-center gap-2.5">
            <IconBadge />
            <Wordmark />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#portal" className="text-[13px] font-semibold" style={{ color: "#b4b4c4" }}>Portal para emprendedores</a>
            <a href="#software" className="text-[13px] font-semibold" style={{ color: "#b4b4c4" }}>Software a medida</a>
            <a href="#contacto" className="text-[13px] font-semibold" style={{ color: "#b4b4c4" }}>Contacto</a>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center text-[13px] font-bold px-4 py-2 rounded-lg"
              style={{ color: BRAND.cream, border: "1px solid #3a3a58" }}
            >
              Contactanos por WhatsApp
            </a>
            <Link
              href="/login"
              className="text-[13px] font-bold px-[18px] py-[9px] rounded-lg"
              style={{ background: `linear-gradient(135deg, #22c3c1, ${BRAND.teal})`, color: BRAND.navy }}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative overflow-hidden" style={{ background: BRAND.navy }}>
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-12 items-center pt-8 md:pt-10 pb-10 md:pb-14 relative z-[2]">
          <div>
            <div className="mb-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-completo-tuequipo.svg" alt="Tu Equipo IA" style={{ height: 73, width: "auto" }} />
            </div>
            <span
              className="inline-block text-[12px] font-bold tracking-wide px-3 py-[5px] rounded-full mb-[18px]"
              style={{ background: "rgba(26,171,170,0.15)", color: BRAND.teal }}
            >
              Tecnología aplicada a negocios reales
            </span>
            <h1 className="text-[32px] sm:text-[38px] md:text-[44px] leading-[1.14] font-bold mb-5" style={{ color: BRAND.cream }}>
              Que tu negocio trabaje para vos.
              <br />
              <span
                style={{ background: `linear-gradient(120deg, ${BRAND.teal}, #6fe0d6)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
              >
                No al revés.
              </span>
            </h1>
            <p className="text-[16px] leading-relaxed mb-[30px] max-w-[520px]" style={{ color: "#b4b4c4" }}>
              Somos Tu Equipo IA. Un portal con herramientas simples para emprendedores que estan empezando, y un
              equipo de desarrollo que crea software a medida para empresas que ya no dan más de tareas manuales y
              repetitivas. Menos horas apagando incendios, más resultados — y más tiempo para la vida que estas
              soñando conseguir, sea cual sea.
            </p>
            <div className="flex gap-3 flex-wrap mb-[34px]">
              <a
                href="#portal"
                className="font-bold text-sm px-[22px] py-[13px] rounded-[9px]"
                style={{ background: `linear-gradient(135deg, #22c3c1, #12807f)`, color: BRAND.navy }}
              >
                Conocé el portal para emprendedores
              </a>
              <a
                href="#software"
                className="font-bold text-sm px-[22px] py-[13px] rounded-[9px]"
                style={{ color: BRAND.cream, border: "1px solid #3a3a58" }}
              >
                Pedí tu software a medida
              </a>
            </div>
            <div className="flex gap-5 flex-wrap">
              {["Orden sin agobio", "Sistemas que no dependen de vos", "Tiempo de vuelta para lo que importa"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: "#9d9db0" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND.teal }} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-[30px] z-0"
              style={{ background: "radial-gradient(circle at 60% 30%, rgba(26,171,170,0.28), transparent 65%)" }}
            />
            <div className="relative z-[1] rounded-2xl p-5" style={{ background: "#21213c", border: "1px solid #2f2f4d" }}>
              <div className="flex gap-1.5 mb-3.5">
                {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#3a3a58" }} />)}
              </div>
              <div className="flex gap-2.5 mb-2.5">
                <div className="flex-1 rounded-[10px] p-3" style={{ background: "#292948" }}>
                  <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "#7c7c96" }}>Ventas del mes</div>
                  <div className="text-[18px] font-bold" style={{ color: BRAND.cream }}>$482.300</div>
                </div>
                <div className="flex-1 rounded-[10px] p-3" style={{ background: "#292948" }}>
                  <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "#7c7c96" }}>Tareas de hoy</div>
                  <div className="text-[18px] font-bold" style={{ color: BRAND.cream }}>4 / 6</div>
                </div>
              </div>
              <div className="rounded-[10px] p-3" style={{ background: "#292948" }}>
                <div className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: "#7c7c96" }}>Progreso semanal</div>
                <div className="flex items-end gap-1.5" style={{ height: 70 }}>
                  {[40, 65, 50, 85, 60, 95, 70].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: BRAND.teal, opacity: 0.85, borderRadius: "4px 4px 0 0" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PILAR 1 · PORTAL */}
      <section id="portal" className="py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <NumBadge n="1" />
          <h2 className="text-[26px] md:text-[30px] font-bold mb-3.5 max-w-[620px]" style={{ color: BRAND.navy }}>
            Ordená tu negocio, para dejar de olvidarte de cosas o dejar de apagar incendios
          </h2>
          <p className="text-[15.5px] leading-relaxed mb-9 max-w-[620px]" style={{ color: "#6b6759" }}>
            Si hoy manejás todo en tu cabeza, en Excel y en el chat de WhatsApp, sabés lo que es no poder despegarte
            ni un rato. El portal te da un lugar simple para ver ventas, tareas, números y estrategia de un vistazo —
            para que decidir no te ocupe la cabeza todo el día, y puedas cerrar la compu sabiendo que el negocio está
            ordenado.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_PORTAL.map((f) => (
              <div key={f.titulo} className="rounded-xl p-5 bg-white transition-transform hover:-translate-y-0.5" style={{ border: "1px solid #e4dfd3" }}>
                <div
                  className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-[15px] mb-3"
                  style={{ background: "linear-gradient(135deg, #eef7f6, #d8f0ed)", color: "#12807f" }}
                >
                  {f.letra}
                </div>
                <h3 className="text-[14.5px] font-bold mb-1.5" style={{ color: BRAND.navy }}>{f.titulo}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "#8a8578" }}>{f.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILAR 2 · SOFTWARE A MEDIDA */}
      <section id="software" className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6">
          <NumBadge n="2" />
          <h2 className="text-[26px] md:text-[30px] font-bold mb-3.5 max-w-[620px]" style={{ color: BRAND.navy }}>
            Sistemas que hacen el trabajo pesado, para que tu equipo no tenga que hacerlo
          </h2>
          <p className="text-[15.5px] leading-relaxed mb-9 max-w-[620px]" style={{ color: "#6b6759" }}>
            Cuando el negocio crece, lo manual empieza a costar caro: errores, tiempo perdido, tareas que sólo sabe
            hacer una persona. Diseñamos y programamos el sistema que tu operación necesita — para que tu equipo
            trabaje mejor y más tranquilo, tus clientes tengan una mejor experiencia, y vos puedas por fin soltar un
            poco sin que todo se caiga.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2.5">
            <div className="rounded-2xl p-6" style={{ background: "#fbeceb", border: "1px solid #f3d4d2" }}>
              <h4 className="text-[13px] uppercase tracking-wide font-bold mb-3.5" style={{ color: "#b3453f" }}>Proceso manual</h4>
              <ul className="pl-[18px] text-[13.5px] leading-8" style={{ color: "#8a5a56" }}>
                <li>Información dispersa en planillas, WhatsApp y papeles</li>
                <li>Tareas repetitivas que dependen de una sola persona</li>
                <li>Errores humanos que cuestan tiempo y plata</li>
                <li>Sin visibilidad real de lo que pasa en el negocio</li>
              </ul>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#eef7f6", border: `2px solid ${BRAND.teal}` }}>
              <h4 className="text-[13px] uppercase tracking-wide font-bold mb-3.5" style={{ color: "#12807f" }}>Con tecnología embebida</h4>
              <ul className="pl-[18px] text-[13.5px] leading-8" style={{ color: "#2d5f5c" }}>
                <li>Un sistema propio que refleja cómo opera tu negocio</li>
                <li>Automatización de lo repetitivo, foco en lo importante</li>
                <li>Datos centralizados y decisiones con información real</li>
                <li>Un equipo técnico que acompaña la evolución del sistema</li>
              </ul>
              <p className="mt-3.5 text-[13px] leading-relaxed font-semibold" style={{ color: "#2d5f5c" }}>
                El resultado no es &quot;más tecnología&quot;: es un equipo que llega a horario a su casa y un negocio
                que sigue funcionando aunque vos te tomes un día.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-9">
            {SERVICIOS_SOFTWARE.map((s) => (
              <div key={s.num} className="rounded-xl p-[18px] text-left transition-transform hover:-translate-y-0.5" style={{ background: `linear-gradient(160deg, #21213c, ${BRAND.navy})` }}>
                <span className="block text-[11px] font-bold mb-2" style={{ color: BRAND.teal }}>{s.num}</span>
                <h5 className="text-[13.5px] font-bold mb-1" style={{ color: BRAND.cream }}>{s.titulo}</h5>
                <p className="text-[12px] leading-normal" style={{ color: "#9d9db0" }}>{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO TRABAJAMOS */}
      <section className="py-20 relative overflow-hidden" style={{ background: BRAND.navy }}>
        <div className="max-w-[1180px] mx-auto px-6 relative z-[1]">
          <div className="text-center mb-11">
            <div className="text-[12px] font-bold uppercase tracking-wide" style={{ color: BRAND.teal }}>Cómo trabajamos</div>
            <h2 className="text-[26px] md:text-[28px] font-bold mt-2" style={{ color: BRAND.cream }}>De la idea al sistema en producción</h2>
            <p className="text-sm max-w-[480px] mx-auto mt-3 leading-relaxed" style={{ color: "#9d9db0" }}>
              Sin sorpresas y sin cotizar a ciegas: para que confiar en un desarrollo a medida no sea un salto de fe.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
            {PASOS_PROCESO.map((p) => (
              <div key={p.num} className="rounded-xl p-5" style={{ background: "#21213c" }}>
                <div className="text-[22px] font-bold mb-2.5" style={{ color: BRAND.teal }}>{p.num}</div>
                <h4 className="text-sm font-bold mb-1.5" style={{ color: BRAND.cream }}>{p.titulo}</h4>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "#9d9db0" }}>{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFIESTO */}
      <section className="py-[76px] bg-white text-center">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 className="text-[22px] md:text-[26px] font-bold max-w-[680px] mx-auto mb-10 leading-relaxed" style={{ color: BRAND.navy }}>
            El objetivo no es tener más tecnología. Es que tu negocio te dé lo que soñaste cuando empezaste: tiempo,
            libertad, resultados — no que te consuma la vida.
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {MANIFIESTO.map((m) => (
              <div key={m.titulo} className="rounded-2xl p-6 transition-transform hover:-translate-y-0.5" style={{ background: BRAND.cream }}>
                <div className="text-[26px] font-bold mb-1.5" style={{ color: "#12807f" }}>{m.titulo}</div>
                <p className="text-[13.5px] leading-relaxed" style={{ color: "#6b6759" }}>{m.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contacto" className="py-[70px]" style={{ background: `linear-gradient(120deg, ${BRAND.teal}, #22c3c1)` }}>
        <div className="max-w-[1180px] mx-auto px-6 flex justify-between items-center flex-wrap gap-5">
          <div>
            <h2 className="text-2xl font-bold mb-1.5 max-w-[480px]" style={{ color: BRAND.navy }}>¿Por dónde querés arrancar?</h2>
            <p className="text-sm max-w-[480px]" style={{ color: "#0d5f5e" }}>
              Sumate al portal si estás arrancando y necesitás orden. Contanos tu proceso si ya es momento de
              automatizarlo. En los dos casos, el objetivo es el mismo: que tu negocio trabaje para vos.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/login" className="font-bold text-sm px-6 py-[13px] rounded-[9px]" style={{ background: BRAND.navy, color: BRAND.cream }}>
              Iniciar sesión
            </Link>
            <a
              href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
              className="font-bold text-sm px-6 py-[13px] rounded-[9px]"
              style={{ background: "transparent", border: "1px solid rgba(26,26,46,0.35)", color: BRAND.navy }}
            >
              Contactanos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-11 pb-7" style={{ background: "#14142a" }}>
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <IconBadge />
              <Wordmark />
            </div>
            <p className="text-[13px] leading-relaxed max-w-[320px]" style={{ color: "#8686a0" }}>
              Portal para emprendedores y desarrollo de software a medida. Tecnología aplicada a procesos reales, no
              plantillas genéricas.
            </p>
          </div>
          <div>
            <h6 className="text-xs uppercase tracking-wide mb-3.5" style={{ color: BRAND.cream }}>Navegación</h6>
            <ul className="space-y-2.5 text-[13px]">
              <li><a href="#portal" style={{ color: "#8686a0" }}>Portal para emprendedores</a></li>
              <li><a href="#software" style={{ color: "#8686a0" }}>Software a medida</a></li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs uppercase tracking-wide mb-3.5" style={{ color: BRAND.cream }}>Contacto</h6>
            <ul className="space-y-2.5 text-[13px]">
              <li><a href={`mailto:${EMAIL_CONTACTO}`} style={{ color: "#8686a0" }}>{EMAIL_CONTACTO}</a></li>
              <li><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ color: "#8686a0" }}>WhatsApp</a></li>
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#8686a0" }}>Instagram @tu_equipo.ia</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1180px] mx-auto px-6 flex justify-between flex-wrap gap-2.5 pt-5 text-xs" style={{ borderTop: "1px solid #26264a", color: "#6c6c88" }}>
          <span>© {new Date().getFullYear()} Tu Equipo IA. Todos los derechos reservados.</span>
        </div>
      </footer>
      </div>
    </div>
  );
}
