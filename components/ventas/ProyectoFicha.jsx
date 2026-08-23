"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { BRAND, HITO_ESTADOS, FACTURA_ESTADOS } from "@/lib/constants";
import { money } from "@/lib/helpers";

const inputCls = "rounded-lg px-3 py-2 text-sm outline-none w-full";
const inputStyle = { border: "1px solid #e4dfd3" };

function sumarMes(fechaISO) {
  const [y, m, d] = fechaISO.split("-").map(Number);
  let año = y, mes = m + 1;
  if (mes > 12) { mes = 1; año += 1; }
  const ultimoDiaMes = new Date(año, mes, 0).getDate();
  return `${año}-${String(mes).padStart(2, "0")}-${String(Math.min(d, ultimoDiaMes)).padStart(2, "0")}`;
}

function TabResumen({ proyecto, onGuardar }) {
  const [cliente, setCliente] = useState(proyecto.cliente || "");
  const [servicio, setServicio] = useState(proyecto.servicio || "");
  const [monto, setMonto] = useState(proyecto.monto ?? "");
  const [formaPago, setFormaPago] = useState(proyecto.forma_pago || "");
  const [responsable, setResponsable] = useState(proyecto.responsable || "");
  const [fechaInicio, setFechaInicio] = useState(proyecto.fecha_inicio ? proyecto.fecha_inicio.slice(0, 10) : "");
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    await onGuardar({ cliente, servicio, monto: monto === "" ? null : Number(monto), formaPago, responsable, fechaInicio: fechaInicio || null });
    setGuardando(false);
  };

  const campo = (label, input) => (
    <div>
      <span style={{ color: "#8a8578" }} className="text-[11px] block mb-1">{label}</span>
      {input}
    </div>
  );

  return (
    <div className="space-y-3">
      {campo("Cliente", <input value={cliente} onChange={(e) => setCliente(e.target.value)} className={inputCls} style={inputStyle} />)}
      {campo("Servicio", <input value={servicio} onChange={(e) => setServicio(e.target.value)} className={inputCls} style={inputStyle} />)}
      <div className="grid grid-cols-2 gap-3">
        {campo("Monto", <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputCls} style={inputStyle} />)}
        {campo("Fecha de inicio", <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputCls} style={inputStyle} />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {campo("Forma de pago", <input value={formaPago} onChange={(e) => setFormaPago(e.target.value)} className={inputCls} style={inputStyle} />)}
        {campo("Responsable", <input value={responsable} onChange={(e) => setResponsable(e.target.value)} className={inputCls} style={inputStyle} />)}
      </div>
      {proyecto.mantenimiento_activo && (
        <p className="text-xs px-2 py-1.5 rounded-md inline-block" style={{ background: "#eef7f6", color: "#127a79" }}>Con mantenimiento mensual activo</p>
      )}
      <button onClick={guardar} disabled={guardando} className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: BRAND.teal, color: BRAND.navy }}>
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

function TabAvance({ proyectoId }) {
  const [hitos, setHitos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    fetch(`/api/crm/hitos?proyectoId=${encodeURIComponent(proyectoId)}`)
      .then((r) => r.json())
      .then((d) => setHitos(d.hitos || []))
      .finally(() => setCargando(false));
  }, [proyectoId]);

  const agregar = async () => {
    if (!nombre.trim()) return;
    const res = await fetch("/api/crm/hitos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proyectoId, nombre, fecha: fecha || null }),
    });
    const data = await res.json();
    if (data.hito) setHitos((prev) => [...prev, data.hito]);
    setNombre(""); setFecha("");
  };

  const cambiarEstado = async (id, estado) => {
    setHitos((prev) => prev.map((h) => (h.id === id ? { ...h, estado } : h)));
    await fetch(`/api/crm/hitos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
  };

  const eliminar = async (id) => {
    await fetch(`/api/crm/hitos/${id}`, { method: "DELETE" });
    setHitos((prev) => prev.filter((h) => h.id !== id));
  };

  const hechos = hitos.filter((h) => h.estado === "hecho").length;
  const avance = hitos.length ? Math.round((hechos / hitos.length) * 100) : 0;

  if (cargando) return <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>;

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span style={{ color: "#8a8578" }} className="text-xs">Avance del proyecto</span>
          <span style={{ color: BRAND.navy }} className="text-xs font-semibold">{avance}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "#eee9dd" }}>
          <div className="h-full" style={{ width: `${avance}%`, background: BRAND.teal }} />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregar()}
          placeholder="Nuevo hito..." className={inputCls} style={inputStyle} />
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputCls} w-40`} style={inputStyle} />
        <button onClick={agregar} className="rounded-lg px-3 py-2 text-sm font-semibold shrink-0" style={{ background: BRAND.teal, color: BRAND.navy }}>
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {hitos.map((h) => (
          <div key={h.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#f0ece2" }}>
            <div>
              <div style={{ color: BRAND.navy, textDecoration: h.estado === "hecho" ? "line-through" : "none" }} className="text-sm">{h.nombre}</div>
              {h.fecha && <div style={{ color: "#a89f88" }} className="text-[11px]">{h.fecha.slice(0, 10)}</div>}
            </div>
            <div className="flex items-center gap-2">
              <select value={h.estado} onChange={(e) => cambiarEstado(h.id, e.target.value)}
                className="text-[11px] px-1.5 py-1 rounded-md outline-none" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                {HITO_ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
              <button onClick={() => eliminar(h.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {hitos.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Sin hitos cargados</p>}
      </div>
    </div>
  );
}

function TabFacturacion({ proyecto }) {
  const [facturas, setFacturas] = useState([]);
  const [mantenimiento, setMantenimiento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [numero, setNumero] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    const pedidos = [fetch(`/api/crm/facturas?proyectoId=${encodeURIComponent(proyecto.id)}`).then((r) => r.json())];
    if (proyecto.mantenimiento_activo) {
      pedidos.push(fetch(`/api/crm/mantenimiento?proyectoId=${encodeURIComponent(proyecto.id)}`).then((r) => r.json()));
    }
    Promise.all(pedidos).then(([f, m]) => {
      setFacturas(f.facturas || []);
      if (m) setMantenimiento(m.mantenimiento || null);
      setCargando(false);
    });
  }, [proyecto.id, proyecto.mantenimiento_activo]);

  const agregarFactura = async () => {
    if (!monto) return;
    const res = await fetch("/api/crm/facturas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proyectoId: proyecto.id, numero, monto: Number(monto), fecha: fecha || null }),
    });
    const data = await res.json();
    if (data.factura) setFacturas((prev) => [...prev, data.factura]);
    setNumero(""); setMonto(""); setFecha("");
  };

  const cambiarEstadoFactura = async (id, estado) => {
    setFacturas((prev) => prev.map((f) => (f.id === id ? { ...f, estado } : f)));
    await fetch(`/api/crm/facturas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
  };

  const eliminarFactura = async (id) => {
    await fetch(`/api/crm/facturas/${id}`, { method: "DELETE" });
    setFacturas((prev) => prev.filter((f) => f.id !== id));
  };

  const marcarCobrado = async () => {
    if (!mantenimiento) return;
    const proximo = mantenimiento.proximo_cobro ? sumarMes(mantenimiento.proximo_cobro.slice(0, 10)) : null;
    setMantenimiento((prev) => ({ ...prev, proximo_cobro: proximo }));
    const res = await fetch(`/api/crm/mantenimiento/${mantenimiento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proximoCobro: proximo }),
    });
    const data = await res.json();
    if (data.mantenimiento) setMantenimiento(data.mantenimiento);
  };

  const cambiarEstadoMantenimiento = async (estado) => {
    setMantenimiento((prev) => ({ ...prev, estado }));
    const res = await fetch(`/api/crm/mantenimiento/${mantenimiento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    const data = await res.json();
    if (data.mantenimiento) setMantenimiento(data.mantenimiento);
  };

  if (cargando) return <p style={{ color: "#8a8578" }} className="text-sm">Cargando...</p>;

  return (
    <div>
      {proyecto.mantenimiento_activo && mantenimiento && (
        <div className="rounded-lg p-3 mb-4" style={{ background: "#eef7f6", border: "1px solid #cdece9" }}>
          <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">Mantenimiento mensual</div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div><span style={{ color: "#8a8578" }}>Monto mensual: </span><span style={{ color: BRAND.navy }} className="font-medium">{money(mantenimiento.monto_mensual)}</span></div>
            <div><span style={{ color: "#8a8578" }}>Día de cobro: </span><span style={{ color: BRAND.navy }} className="font-medium">{mantenimiento.dia_cobro || "—"}</span></div>
            <div><span style={{ color: "#8a8578" }}>Próximo cobro: </span><span style={{ color: BRAND.navy }} className="font-medium">{mantenimiento.proximo_cobro?.slice(0, 10) || "—"}</span></div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "#8a8578" }}>Estado:</span>
              <select value={mantenimiento.estado} onChange={(e) => cambiarEstadoMantenimiento(e.target.value)}
                className="text-[11px] px-1.5 py-0.5 rounded-md outline-none" style={{ border: "1px solid #cdece9" }}>
                <option value="activo">Activo</option>
                <option value="pausado">Pausado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <button onClick={marcarCobrado} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ background: BRAND.teal, color: BRAND.navy }}>
            Marcar cobrado este mes
          </button>
        </div>
      )}

      <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">Facturas</div>
      <div className="flex gap-2 mb-3">
        <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="N° factura" className={`${inputCls} w-28`} style={inputStyle} />
        <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Monto" className={inputCls} style={inputStyle} />
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputCls} w-40`} style={inputStyle} />
        <button onClick={agregarFactura} className="rounded-lg px-3 py-2 text-sm font-semibold shrink-0" style={{ background: BRAND.teal, color: BRAND.navy }}>
          <Plus size={14} />
        </button>
      </div>
      <div className="space-y-2">
        {facturas.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#f0ece2" }}>
            <div className="text-sm" style={{ color: BRAND.navy }}>
              {f.numero && <span className="font-medium">{f.numero} — </span>}
              {money(f.monto)} {f.fecha && <span style={{ color: "#a89f88" }} className="text-[11px]">({f.fecha.slice(0, 10)})</span>}
            </div>
            <div className="flex items-center gap-2">
              <select value={f.estado} onChange={(e) => cambiarEstadoFactura(f.id, e.target.value)}
                className="text-[11px] px-1.5 py-1 rounded-md outline-none" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
                {FACTURA_ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
              <button onClick={() => eliminarFactura(f.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        {facturas.length === 0 && <p style={{ color: "#a89f88" }} className="text-xs text-center py-3">Sin facturas cargadas</p>}
      </div>
    </div>
  );
}

// Ficha de un proyecto de Ventas → Seguimiento, con 3 tabs: Resumen /
// Avance del proyecto / Facturación y cobro.
export default function ProyectoFicha({ open, proyecto, onClose, onGuardarResumen }) {
  const [tab, setTab] = useState("resumen");

  useEffect(() => { if (open) setTab("resumen"); }, [open, proyecto?.id]);

  if (!open || !proyecto) return null;

  const tabs = [
    { id: "resumen", label: "Resumen" },
    { id: "avance", label: "Avance del proyecto" },
    { id: "facturacion", label: "Facturación y cobro" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,20,32,0.55)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl p-5 max-h-[90vh] overflow-y-auto" style={{ background: BRAND.cream }}>
        <div className="flex items-center justify-between mb-1">
          <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{proyecto.cliente}</h3>
          <button onClick={onClose} style={{ color: "#8a8578" }}><X size={18} /></button>
        </div>
        {proyecto.servicio && <p style={{ color: "#8a8578" }} className="text-xs mb-4">{proyecto.servicio}</p>}

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={tab === t.id ? { background: BRAND.navy, color: BRAND.cream } : { background: "#eee9dd", color: "#6b6759" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resumen" && <TabResumen proyecto={proyecto} onGuardar={onGuardarResumen} />}
        {tab === "avance" && <TabAvance proyectoId={proyecto.id} />}
        {tab === "facturacion" && <TabFacturacion proyecto={proyecto} />}
      </div>
    </div>
  );
}
