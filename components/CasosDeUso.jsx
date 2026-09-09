import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { CASOS_DE_USO, urlCaso } from "@/lib/casosDeUso";

function Tarjeta({ caso }) {
  const contenido = (
    <>
      <div className="relative" style={{ background: "#eef7f6" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={caso.miniatura}
          alt=""
          className="block w-full"
          style={{ aspectRatio: "16 / 11", objectFit: "cover", opacity: caso.disponible ? 1 : 0.6 }}
        />
        <span
          className="absolute top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-wide"
          style={{ background: caso.disponible ? BRAND.teal : "#9aa3a2", color: "#fff" }}
        >
          {caso.rubro}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-5">
        <h3 className="text-[16px] font-bold leading-snug mb-2" style={{ color: BRAND.navy }}>
          {caso.titulo}
        </h3>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "#6b6759" }}>
          {caso.texto}
        </p>
      </div>

      <div className="mx-5 mt-4 border-t pt-3 text-[12.5px]" style={{ borderColor: "#e7e2d9", color: "#8c887f" }}>
        {caso.meta}
      </div>
      <div
        className="px-5 pb-5 pt-2.5 text-[11.5px] font-bold uppercase tracking-wide"
        style={{ color: caso.disponible ? "#12807f" : "#a9a49b" }}
      >
        {caso.disponible ? "Ver demo »" : "Demo en preparación"}
      </div>
    </>
  );

  const clasesBase = "flex h-full flex-col overflow-hidden rounded-2xl bg-white";
  const estilo = { border: "1px solid #e7e2d9" };

  if (!caso.disponible) {
    return (
      <div className={clasesBase} style={{ ...estilo, opacity: 0.78 }} aria-disabled="true">
        {contenido}
      </div>
    );
  }

  return (
    <Link
      href={urlCaso(caso)}
      className={`${clasesBase} transition-transform hover:-translate-y-1`}
      style={estilo}
    >
      {contenido}
    </Link>
  );
}

export default function CasosDeUso() {
  return (
    <section id="casos" className="py-20" style={{ background: BRAND.cream }}>
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-3.5">
          <h2 className="text-[26px] md:text-[30px] font-bold" style={{ color: BRAND.navy }}>
            Casos de uso
          </h2>
        </div>
        <p className="text-[15.5px] leading-relaxed mb-9 max-w-[620px]" style={{ color: "#6b6759" }}>
          Cada sistema empieza siendo un problema concreto de una empresa concreta. Entrá a cualquiera y vas a ver el
          mismo material que le mostramos al cliente antes de construirlo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CASOS_DE_USO.map((caso) => (
            <Tarjeta key={caso.slug} caso={caso} />
          ))}
        </div>
      </div>
    </section>
  );
}
