import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND, WHATSAPP_LINK } from "@/lib/constants";
import { CASOS_DE_USO, getCaso, urlDemo } from "@/lib/casosDeUso";

// Solo se generan las rutas de los casos que ya tienen demo publicada.
export function generateStaticParams() {
  return CASOS_DE_USO.filter((c) => c.disponible).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const caso = getCaso(slug);
  if (!caso) return {};
  return {
    title: `${caso.titulo} — Tu Equipo IA`,
    description: caso.texto,
    openGraph: {
      title: `${caso.titulo} — Tu Equipo IA`,
      description: caso.texto,
      images: [caso.miniatura],
    },
  };
}

export default async function CasoPage({ params }) {
  const { slug } = await params;
  const caso = getCaso(slug);
  if (!caso || !caso.disponible) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Barra del sitio: la demo vive adentro, pero el visitante sigue en tuequipoia */}
      <header className="shrink-0" style={{ background: BRAND.navy, borderBottom: "1px solid #2a2a45" }}>
        <div className="max-w-[1180px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/#casos" className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icono-tuequipo.svg" alt="" style={{ width: 19, height: 19 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-texto-tuequipo.svg" alt="Tu Equipo IA" style={{ height: 20, width: "auto" }} />
            <span className="hidden md:inline text-[13px] truncate" style={{ color: "#b4b4c4" }}>
              — {caso.titulo}
            </span>
          </Link>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/#casos"
              className="hidden sm:inline-flex text-[13px] font-bold px-4 py-2 rounded-lg"
              style={{ color: BRAND.cream, border: "1px solid #3a3a58" }}
            >
              Volver a casos
            </Link>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold px-[18px] py-[9px] rounded-lg"
              style={{ background: `linear-gradient(135deg, #22c3c1, ${BRAND.teal})`, color: BRAND.navy }}
            >
              Quiero uno así
            </a>
          </div>
        </div>
      </header>

      {/* La demo es un HTML autocontenido servido desde /public/casos. Se
          reemplaza pisando el archivo, sin tocar este componente. */}
      <iframe
        src={urlDemo(caso)}
        title={caso.titulo}
        className="w-full flex-1 border-0"
        style={{ background: BRAND.cream }}
      />
    </div>
  );
}
