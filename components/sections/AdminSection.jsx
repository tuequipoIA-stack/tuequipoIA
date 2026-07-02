"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Shield } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { money } from "@/lib/helpers";
import AdminUserDetail from "@/components/admin/AdminUserDetail";

const ESTADO_LABEL = { trial: "Prueba", active: "Activo", past_due: "Vencido", canceled: "Cancelado" };
const ESTADO_COLOR = {
  trial: { bg: "#f0ece2", text: "#6b6759" },
  active: { bg: "#eef7f6", text: "#127a79" },
  past_due: { bg: "#fdf0e6", text: "#b3703f" },
  canceled: { bg: "#fbeceb", text: "#b3453f" },
};

function SugerenciasTab() {
  const [sugerencias, setSugerencias] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/sugerencias")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setSugerencias(d.sugerencias);
      });
  }, []);

  if (error) return <p style={{ color: "#b3453f" }} className="text-sm">{error}</p>;
  if (!sugerencias) return <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>;
  if (sugerencias.length === 0) return <p style={{ color: "#8a8578" }} className="text-sm">Todavía no llegó ninguna sugerencia.</p>;

  return (
    <div className="space-y-3">
      {sugerencias.map((s) => (
        <div key={s.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: BRAND.navy }} className="text-xs font-semibold">{s.email || "Anónimo"}</span>
            <span style={{ color: "#8a8578" }} className="text-xs">{new Date(s.created_at).toLocaleString("es-AR")}</span>
          </div>
          <p style={{ color: "#4a4740" }} className="text-sm whitespace-pre-wrap">{s.mensaje}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminSection() {
  const [tab, setTab] = useState("usuarios");
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  const cargarUsuarios = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setUsuarios(d.usuarios);
      });
  };

  useEffect(() => { cargarUsuarios(); }, []);

  if (seleccionado) {
    return (
      <AdminUserDetail
        userId={seleccionado}
        onBack={(huboCambios) => {
          setSeleccionado(null);
          if (huboCambios) cargarUsuarios();
        }}
      />
    );
  }

  const activos = usuarios?.filter((u) => u.subscriptionStatus === "active").length ?? 0;
  const enPrueba = usuarios?.filter((u) => u.subscriptionStatus === "trial").length ?? 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Shield size={18} color={BRAND.navy} />
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Admin</h2>
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-5">Todos los suscriptores, para ayudarlos o entender cómo usan la app.</p>

      <div className="flex gap-1.5 mb-5">
        <button onClick={() => setTab("usuarios")} className="px-3 py-1.5 rounded-md text-xs font-medium"
          style={tab === "usuarios" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          Usuarios
        </button>
        <button onClick={() => setTab("sugerencias")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
          style={tab === "sugerencias" ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
          <MessageSquare size={12} /> Sugerencias
        </button>
      </div>

      {tab === "sugerencias" ? (
        <SugerenciasTab />
      ) : (
        <>
          {error && <p style={{ color: "#b3453f" }} className="text-sm mb-4">{error}</p>}

          {usuarios && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl p-4" style={{ background: BRAND.navy }}>
                <span style={{ color: "#8b8b9a" }} className="text-xs">Usuarios totales</span>
                <div style={{ color: BRAND.teal }} className="text-2xl font-semibold">{usuarios.length}</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <span style={{ color: "#8a8578" }} className="text-xs">Suscripciones activas</span>
                <div style={{ color: BRAND.navy }} className="text-2xl font-semibold">{activos}</div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <span style={{ color: "#8a8578" }} className="text-xs">En período de prueba</span>
                <div style={{ color: BRAND.navy }} className="text-2xl font-semibold">{enPrueba}</div>
              </div>
            </div>
          )}

          {!usuarios && !error && <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>}

          {usuarios && usuarios.length === 0 && (
            <p style={{ color: "#8a8578" }} className="text-sm">Todavía no hay suscriptores registrados.</p>
          )}

          <div className="space-y-2">
            {usuarios?.map((u) => (
              <button key={u.id} onClick={() => setSeleccionado(u.id)}
                className="w-full text-left rounded-xl p-4 flex items-center justify-between hover:opacity-90"
                style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                <div>
                  <div style={{ color: BRAND.navy }} className="text-sm font-semibold">
                    {u.nombreNegocio || "(sin nombre de negocio)"}
                    {u.isAdmin && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: BRAND.navy, color: BRAND.cream }}>admin</span>}
                  </div>
                  <div style={{ color: "#8a8578" }} className="text-xs">{u.email} {u.rubro ? `· ${u.rubro}` : ""}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div style={{ color: BRAND.navy }} className="text-xs font-medium">{money(u.ventasMes)}</div>
                    <div style={{ color: "#a89f88" }} className="text-[10px]">ventas del mes</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-semibold"
                    style={{ background: ESTADO_COLOR[u.subscriptionStatus]?.bg, color: ESTADO_COLOR[u.subscriptionStatus]?.text }}>
                    {ESTADO_LABEL[u.subscriptionStatus] || u.subscriptionStatus}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
