"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { BRAND } from "@/lib/constants";
import { ESTADOS, ESTADO_COLOR, MARCAS, labelEstado, segNombre, fillTemplate, gmailLink, gmailAuthUserKey } from "@/lib/panel/constants";
import { contactosApi, interaccionesApi } from "@/lib/panel/api";
import { inferirDolor } from "@/lib/panel/coldEmailMatrix";

function gmailAuthUser() {
  if (typeof window === "undefined") return "0";
  return window.localStorage.getItem(gmailAuthUserKey()) || "0";
}

function parseCSV(text) {
  text = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c && c.trim().length));
}

// Lee la primera hoja de un .xlsx/.xls y la devuelve como filas de texto
// (mismo formato que parseCSV: array de arrays, primera fila = encabezados).
function parseXLSX(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
  return rows
    .map((r) => r.map((c) => (c === null || c === undefined ? "" : String(c).trim())))
    .filter((r) => r.some((c) => c && c.trim().length));
}

// "apellido" no es un campo propio de contactos: se junta con "nombre" al
// armar el contacto (ver confirmar()). Se lista igual para que el usuario
// pueda mapear la columna de apellido de exports como los de Apollo.
const CAMPO_GUESS = {
  nombre: ["nombre", "name", "first_name", "first name"],
  apellido: ["apellido", "last_name", "last name", "surname"],
  empresa: ["empresa", "company", "organizacion", "organización", "company name"],
  puesto: ["puesto", "cargo", "role", "title"],
  industria: ["industria", "industry", "rubro", "sector"],
  email: ["email", "mail", "correo", "e-mail"],
  telefono: ["telefono", "teléfono", "phone", "celular", "whatsapp", "corporate phone", "mobile phone", "work direct phone"],
  pais: ["pais", "país", "country", "company country", "person country"],
};
const CAMPOS_APP = [["nombre", "Nombre"], ["apellido", "Apellido"], ["empresa", "Empresa"], ["puesto", "Puesto"], ["industria", "Industria"], ["email", "Email"], ["telefono", "Teléfono"], ["pais", "País"], ["", "(ignorar)"]];

function adivinar(header) {
  const h = (header || "").toLowerCase().trim();
  for (const key in CAMPO_GUESS) if (CAMPO_GUESS[key].includes(h)) return key;
  return "";
}

function ImportarCSV({ marca, setMarca, onImportado, showToast }) {
  const [headers, setHeaders] = useState(null);
  const [rows, setRows] = useState([]);
  const [mapa, setMapa] = useState({});
  const [importando, setImportando] = useState(false);

  const cargarFilas = (parsed) => {
    const hs = parsed[0];
    setHeaders(hs);
    setRows(parsed.slice(1));
    const m = {};
    hs.forEach((h) => { m[h] = adivinar(h); });
    setMapa(m);
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const esExcel = /\.(xlsx|xls)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = esExcel ? parseXLSX(reader.result) : parseCSV(reader.result);
      cargarFilas(parsed);
    };
    if (esExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const confirmar = async () => {
    setImportando(true);
    const colIndex = {};
    headers.forEach((h, i) => { if (mapa[h]) colIndex[mapa[h]] = i; });
    const contactos = rows.map((r) => {
      const get = (k) => (colIndex[k] !== undefined ? (r[colIndex[k]] || "").trim() : "");
      const nombreCompleto = [get("nombre"), get("apellido")].filter(Boolean).join(" ").trim();
      return { nombre: nombreCompleto, empresa: get("empresa"), puesto: get("puesto"), industria: get("industria"), email: get("email"), telefono: get("telefono"), pais: get("pais") };
    }).filter((c) => c.nombre);

    if (!contactos.length) {
      showToast("Ninguna fila tiene 'Nombre' asignado — revisá el mapeo de columnas arriba del archivo");
      setImportando(false);
      return;
    }

    try {
      const { importados, omitidos } = await contactosApi.bulkImport(contactos, marca);
      showToast(`${importados} contactos importados${omitidos ? `, ${omitidos} omitidos` : ""}`);
      setHeaders(null); setRows([]);
      onImportado();
    } catch (e) {
      showToast("Error al importar: " + e.message);
    }
    setImportando(false);
  };

  return (
    <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold mb-2">Cargar contactos (CSV o Excel)</h3>
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <label className="cursor-pointer text-sm font-semibold px-4 py-2 rounded-md text-white" style={{ background: BRAND.navy }}>
          Cargar archivo
          <input type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={onFile} className="hidden" />
        </label>
        <a
          href="/plantilla-contactos.csv"
          download
          className="text-sm font-semibold px-4 py-2 rounded-md"
          style={{ border: `1px solid ${BRAND.navy}`, color: BRAND.navy }}
        >
          Descargar plantilla
        </a>
        <label className="flex items-center gap-1.5 text-xs" style={{ color: "#8a8578" }}>
          Se importan a:
          <select value={marca} onChange={(e) => setMarca(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
            {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ color: "#8a8578" }} className="text-xs">Soporta .csv, .xlsx y .xls (incluye exports de Apollo). Descargá la plantilla si no sabés qué columnas usar. Revisá el mapeo de columnas antes de confirmar. Duplicados por email se actualizan.</span>
      </div>
      {headers && (
        <div className="mt-3">
          <div className="overflow-auto max-h-56 rounded-md" style={{ border: "1px solid #eee" }}>
            <table className="text-xs w-full">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="p-1.5 text-left" style={{ color: "#8a8578" }}>
                      {h}
                      <select value={mapa[h] || ""} onChange={(e) => setMapa({ ...mapa, [h]: e.target.value })} className="block mt-1 text-xs" style={{ border: "1px solid #ddd" }}>
                        {CAMPOS_APP.map((f) => <option key={f[0]} value={f[0]}>{f[1]}</option>)}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j} className="p-1.5" style={{ color: "#6b6759" }}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 mt-2">
            <button disabled={importando} onClick={confirmar} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>
              {importando ? "Importando..." : "Confirmar importación"}
            </button>
            <button onClick={() => { setHeaders(null); setRows([]); }} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CampoEditable({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-xs" style={{ color: "#8a8578" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "—"}
        className="text-sm rounded-md p-1.5"
        style={{ border: "1px solid #ddd" }}
      />
    </label>
  );
}

function NuevoContactoManual({ marca, setMarca, onCreado, showToast }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [puesto, setPuesto] = useState("");
  const [industria, setIndustria] = useState("");
  const [pais, setPais] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [canal, setCanal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const limpiar = () => {
    setNombre(""); setEmpresa(""); setPuesto(""); setIndustria(""); setPais("");
    setEmail(""); setTelefono(""); setCanal(""); setObservaciones("");
  };

  const guardar = async () => {
    if (!nombre.trim()) { showToast("Falta el nombre del contacto"); return; }
    setGuardando(true);
    try {
      const { importados, omitidos } = await contactosApi.bulkImport(
        [{
          nombre: nombre.trim(), empresa: empresa.trim(), puesto: puesto.trim(),
          industria: industria.trim(), pais: pais.trim(), email: email.trim(),
          telefono: telefono.trim(), canal_preferido: canal, observaciones: observaciones.trim(),
        }],
        marca
      );
      if (importados) {
        showToast(`Contacto "${nombre.trim()}" cargado`);
        limpiar();
        setAbierto(false);
        onCreado();
      } else {
        showToast("No se pudo cargar el contacto" + (omitidos ? " (revisá los datos)" : ""));
      }
    } catch (e) {
      showToast("Error al cargar: " + e.message);
    }
    setGuardando(false);
  };

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="text-sm font-semibold px-4 py-2 rounded-md mb-5" style={{ border: `1px solid ${BRAND.navy}`, color: BRAND.navy, background: "#ffffff" }}>
        + Cargar un cliente a mano
      </button>
    );
  }

  return (
    <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold">Cargar un cliente a mano</h3>
        <label className="flex items-center gap-1.5 text-xs" style={{ color: "#8a8578" }}>
          Se carga a:
          <select value={marca} onChange={(e) => setMarca(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
            {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <CampoEditable label="Nombre *" value={nombre} onChange={setNombre} />
        <CampoEditable label="Empresa" value={empresa} onChange={setEmpresa} />
        <CampoEditable label="Puesto" value={puesto} onChange={setPuesto} />
        <CampoEditable label="Industria" value={industria} onChange={setIndustria} />
        <CampoEditable label="País" value={pais} onChange={setPais} />
        <CampoEditable label="Email" value={email} onChange={setEmail} type="email" />
        <CampoEditable label="Teléfono" value={telefono} onChange={setTelefono} />
        <label className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: "#8a8578" }}>Canal preferido</span>
          <select value={canal} onChange={(e) => setCanal(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
            <option value="">Sin definir</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-0.5 mb-3">
        <span className="text-xs" style={{ color: "#8a8578" }}>Observaciones</span>
        <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2} placeholder="Notas sobre este contacto..." className="text-sm rounded-md p-1.5 resize-y" style={{ border: "1px solid #ddd" }} />
      </label>
      <div className="flex gap-2">
        <button disabled={guardando} onClick={guardar} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>
          {guardando ? "Guardando..." : "Guardar contacto"}
        </button>
        <button onClick={() => { limpiar(); setAbierto(false); }} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Cancelar</button>
      </div>
    </div>
  );
}

function DetalleContacto({ contacto, segmentos, onCerrar, onActualizado, showToast }) {
  const [nombre, setNombre] = useState(contacto.nombre || "");
  const [empresa, setEmpresa] = useState(contacto.empresa || "");
  const [puesto, setPuesto] = useState(contacto.puesto || "");
  const [industria, setIndustria] = useState(contacto.industria || "");
  const [pais, setPais] = useState(contacto.pais || "");
  const [email, setEmail] = useState(contacto.email || "");
  const [telefono, setTelefono] = useState(contacto.telefono || "");
  const [observaciones, setObservaciones] = useState(contacto.observaciones || "");
  const [estado, setEstado] = useState(contacto.estado);
  const [canal, setCanal] = useState(contacto.canal_preferido || "");
  const [proximo, setProximo] = useState(contacto.proximo_seguimiento ? contacto.proximo_seguimiento.slice(0, 16) : "");
  const [interacciones, setInteracciones] = useState(null);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);

  useState(() => {
    interaccionesApi.list(contacto.id).then(setInteracciones).catch(() => setInteracciones([]));
  }, []);

  const seg = segmentos.find((s) => s.id === contacto.segmento_id);

  const guardar = async () => {
    setGuardando(true);
    try {
      await contactosApi.update(contacto.id, {
        nombre: nombre.trim(),
        empresa: empresa.trim() || null,
        puesto: puesto.trim() || null,
        industria: industria.trim() || null,
        pais: pais.trim() || null,
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        observaciones: observaciones.trim() || null,
        estado,
        canal_preferido: canal || null,
        proximo_seguimiento: proximo ? new Date(proximo).toISOString() : null,
      });
      showToast("Guardado");
      onActualizado();
    } catch (e) {
      showToast("Error al guardar: " + e.message);
    }
    setGuardando(false);
  };

  const agregarNota = async () => {
    if (!nota.trim()) return;
    const ins = await interaccionesApi.create({ contacto_id: contacto.id, canal: "email", tipo: "nota_manual", contenido: nota.trim() });
    setInteracciones((prev) => [ins, ...(prev || [])]);
    setNota("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(20, 20, 30, 0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
    >
    <div className="rounded-xl p-4 w-full max-w-2xl my-4" style={{ background: "#faf9f6", border: "1px solid #e4dfd3", boxShadow: "0 10px 40px rgba(0,0,0,0.25)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ color: BRAND.navy }} className="text-base font-semibold">{contacto.nombre}</h3>
        <button onClick={onCerrar} className="text-xs px-2 py-1 rounded-md" style={{ color: "#4a4740", background: "#f1efe8" }}>Cerrar ✕</button>
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
        <strong className="text-xs" style={{ color: "#8a8578" }}>Datos del contacto</strong>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <CampoEditable label="Nombre" value={nombre} onChange={setNombre} />
          <CampoEditable label="Empresa" value={empresa} onChange={setEmpresa} />
          <CampoEditable label="Puesto" value={puesto} onChange={setPuesto} />
          <CampoEditable label="Industria" value={industria} onChange={setIndustria} />
          <CampoEditable label="País" value={pais} onChange={setPais} />
          <CampoEditable label="Email" value={email} onChange={setEmail} type="email" />
          <CampoEditable label="Teléfono" value={telefono} onChange={setTelefono} />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: "#8a8578" }}>Segmento</span>
            <span className="text-sm p-1.5">{seg ? segNombre(seg) : "sin asignar"}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center mb-3">
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
        <select value={canal} onChange={(e) => setCanal(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          <option value="">Canal preferido: sin definir</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <input type="datetime-local" value={proximo} onChange={(e) => setProximo(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }} />
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
        <label className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: "#8a8578" }}>Observaciones</span>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas generales sobre este contacto..."
            rows={3}
            className="text-sm rounded-md p-1.5 resize-y"
            style={{ border: "1px solid #ddd" }}
          />
        </label>
      </div>

      <button disabled={guardando} onClick={guardar} className="text-xs px-3 py-1.5 rounded-md text-white mb-3" style={{ background: BRAND.navy }}>
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>

      <div className="rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
        <strong className="text-xs" style={{ color: "#8a8578" }}>Historial de interacciones</strong>
        <div className="mt-2 space-y-2">
          {(interacciones || []).length === 0 && <p className="text-xs" style={{ color: "#8a8578" }}>Sin interacciones todavía.</p>}
          {(interacciones || []).map((i) => (
            <div key={i.id} className="text-xs" style={{ color: "#4a4740" }}>
              <span className="font-semibold">{i.canal}</span> · {i.tipo} · {new Date(i.fecha).toLocaleString("es-AR")}
              {i.contenido && <p className="mt-0.5" style={{ color: "#6b6759" }}>{i.contenido}</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Agregar nota manual" className="flex-1 text-xs rounded-md p-1.5" style={{ border: "1px solid #ddd" }} />
          <button onClick={agregarNota} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "#f1efe8", color: "#4a4740" }}>Agregar</button>
        </div>
      </div>
    </div>
    </div>
  );
}

function BarraAcciones({ cantidad, marcaDestino, setMarcaDestino, onMigrar, onEliminar, onGenerarIA, onCancelar, procesando }) {
  return (
    <div className="flex items-center gap-2 flex-wrap rounded-lg p-2.5 mb-3" style={{ background: "#eef3fb", border: "1px solid #cfe0f5" }}>
      <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>{cantidad} seleccionado{cantidad === 1 ? "" : "s"}</span>
      <span className="text-xs" style={{ color: "#8a8578" }}>Migrar a:</span>
      <select value={marcaDestino} onChange={(e) => setMarcaDestino(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
        {MARCAS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <button disabled={procesando} onClick={onMigrar} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>
        {procesando ? "Migrando..." : "Migrar"}
      </button>
      <button disabled={procesando} onClick={onEliminar} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: "#b3453f" }}>
        Eliminar
      </button>
      <button onClick={onGenerarIA} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: "#2563eb" }}>
        ✨ Generar email con IA
      </button>
      <button onClick={onCancelar} className="text-xs px-3 py-1.5 rounded-md ml-auto" style={{ background: "#f1efe8", color: "#4a4740" }}>
        Cancelar selección
      </button>
    </div>
  );
}

// Genera, para un grupo de contactos elegidos a mano (checkboxes), una
// sola plantilla de cold email con IA (asunto A/B + cuerpo con
// {{nombre}}/{{empresa}} como placeholders) y arma con eso una cola de
// envío personalizada por contacto, igual mecánica que la cola de envío
// por segmento pero para una selección libre en vez de un segmento fijo.
function GeneradorGrupoIA({ contactos, onCerrar, showToast }) {
  const marca = contactos[0]?.marca_origen;
  const marcasDistintas = new Set(contactos.map((c) => c.marca_origen)).size > 1;

  const dolorPreview = useMemo(() => {
    if (marcasDistintas || !marca) return null;
    const conteo = {};
    contactos.forEach((c) => {
      const { dolor } = inferirDolor(marca, c.industria, c.puesto);
      conteo[dolor] = (conteo[dolor] || 0) + 1;
    });
    const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : null;
  }, [contactos, marca, marcasDistintas]);

  const [triggerEvent, setTriggerEvent] = useState("");
  const [objetivo, setObjetivo] = useState("Agendar llamada de 15 min");
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [enviados, setEnviados] = useState({});

  const generar = async () => {
    setGenerando(true);
    try {
      const r = await contactosApi.generarGrupo({ ids: contactos.map((c) => c.id), trigger_event: triggerEvent, objetivo });
      setResultado(r);
    } catch (e) {
      showToast("Error al generar: " + e.message);
    }
    setGenerando(false);
  };

  const marcarEnviado = async (c, mensaje) => {
    try {
      await interaccionesApi.create({ contacto_id: c.id, canal: "email", tipo: "mensaje_enviado", contenido: mensaje });
      setEnviados((prev) => ({ ...prev, [c.id]: true }));
    } catch (e) {
      showToast("No se pudo registrar el envío: " + e.message);
    }
  };

  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: "#faf9f6", border: "1px solid #e4dfd3" }}>
      <div className="flex items-center justify-between mb-2">
        <h3 style={{ color: BRAND.navy }} className="text-sm font-semibold">Generar email con IA para el grupo ({contactos.length})</h3>
        <button onClick={onCerrar} className="text-xs px-2 py-1 rounded-md" style={{ color: "#4a4740", background: "#f1efe8" }}>Cerrar ✕</button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {contactos.map((c) => (
          <span key={c.id} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#f1efe8", color: "#4a4740" }}>{c.empresa || c.nombre}</span>
        ))}
      </div>

      {marcasDistintas ? (
        <p className="text-sm" style={{ color: "#791f1f" }}>Los contactos seleccionados son de marcas distintas. Elegí contactos de una sola marca para generar el email en grupo.</p>
      ) : !resultado ? (
        <div className="rounded-lg p-3" style={{ background: "#ffffff", border: "1px solid #cfe0f5" }}>
          <p className="text-xs mb-2" style={{ color: "#8a8578" }}>Comparten marca <strong style={{ color: "#4a4740" }}>{marca}</strong>. La IA arma una sola plantilla con variables por nombre y empresa, y un preview personalizado por cada contacto.</p>
          {dolorPreview && (
            <div className="mb-3">
              <span className="text-xs block mb-1" style={{ color: "#8a8578" }}>Dolor inferido (revisalo antes de generar)</span>
              <div className="text-sm rounded-md p-2" style={{ background: "#e6f1fb", color: "#0c447c" }}>{dolorPreview}</div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap mb-3">
            <input value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value)} placeholder="Trigger event (opcional)" className="flex-1 text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }} />
            <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
              <option>Agendar llamada de 15 min</option>
              <option>Ofrecer demo</option>
              <option>Enviar recurso / caso</option>
            </select>
          </div>
          <button disabled={generando} onClick={generar} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: BRAND.navy }}>
            {generando ? "Generando..." : "✨ Generar con IA"}
          </button>
        </div>
      ) : (
        <div>
          <div className="rounded-lg p-3 mb-3" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
            <strong className="text-xs" style={{ color: "#8a8578" }}>Plantilla base</strong>
            <p className="text-sm mt-1" style={{ color: "#4a4740" }}><strong>Asunto A:</strong> {resultado.asunto_a}</p>
            <p className="text-sm" style={{ color: "#4a4740" }}><strong>Asunto B:</strong> {resultado.asunto_b}</p>
            <p className="text-sm whitespace-pre-wrap mt-1" style={{ color: "#4a4740" }}>{resultado.cuerpo}</p>
            <button onClick={() => setResultado(null)} className="text-xs px-2.5 py-1 rounded-md mt-2" style={{ background: "#f1efe8", color: "#4a4740" }}>Regenerar</button>
          </div>

          <strong className="text-xs block mb-2" style={{ color: "#8a8578" }}>Cola de envío — {contactos.length} preview{contactos.length === 1 ? "" : "s"} personalizado{contactos.length === 1 ? "" : "s"}</strong>
          <div className="space-y-2">
            {contactos.map((c) => {
              const asunto = fillTemplate(resultado.asunto_a, c);
              const mensaje = fillTemplate(resultado.cuerpo, c);
              const href = gmailLink(c.email, asunto, mensaje, gmailAuthUser());
              const ya = !!enviados[c.id];
              return (
                <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg p-2.5" style={{ background: "#ffffff", border: "1px solid #eee7d8" }}>
                  <div className="text-sm flex-1">
                    <strong style={{ color: BRAND.navy }}>{c.nombre}</strong> <span style={{ color: "#8a8578" }}>{c.empresa}</span>
                    <p className="text-xs mt-1" style={{ color: "#6b6759" }}>{asunto}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {c.email ? (
                      <a href={href} target="_blank" rel="noreferrer" onClick={() => marcarEnviado(c, mensaje)} className="text-[11px] font-bold px-2.5 py-1 rounded-md text-white" style={{ background: "#2563eb" }}>Abrir Gmail</a>
                    ) : (
                      <span className="text-[11px]" style={{ color: "#8a8578" }}>Sin email</span>
                    )}
                    {ya && <span className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: "#eaf3de", color: "#27500a" }}>Registrado</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PanelContactos({ contactos, segmentos, marcaFiltro, recargar, showToast }) {
  const [marcaImport, setMarcaImport] = useState(
    marcaFiltro && marcaFiltro !== "todas" ? marcaFiltro : MARCAS[0]
  );
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [abiertoId, setAbiertoId] = useState(null);
  const [seleccionados, setSeleccionados] = useState(() => new Set());
  const [marcaDestino, setMarcaDestino] = useState(MARCAS[0]);
  const [procesando, setProcesando] = useState(false);
  const [grupoIAAbierto, setGrupoIAAbierto] = useState(false);

  // La pestaña "Marca:" de arriba filtra qué contactos se ven. Si el
  // selector de importación no sigue esa misma marca, es fácil subir un
  // archivo pensando que va a una marca y que termine en otra (los
  // contactos se importan igual, solo que no aparecen en la pestaña que
  // se está mirando). Lo mantenemos sincronizado con la pestaña activa.
  useEffect(() => {
    if (marcaFiltro && marcaFiltro !== "todas") setMarcaImport(marcaFiltro);
  }, [marcaFiltro]);

  const filtrados = useMemo(() => {
    let f = contactos;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      f = f.filter((c) => (c.nombre || "").toLowerCase().includes(b) || (c.empresa || "").toLowerCase().includes(b));
    }
    if (estadoFiltro) f = f.filter((c) => c.estado === estadoFiltro);
    return f;
  }, [contactos, busqueda, estadoFiltro]);

  // Si cambian los filtros y algún seleccionado deja de estar visible, no
  // pasa nada (sigue seleccionado para las acciones), pero limpiamos ids
  // que ya no existen (por ejemplo tras eliminar).
  useEffect(() => {
    const idsValidos = new Set(contactos.map((c) => c.id));
    setSeleccionados((prev) => {
      const next = new Set([...prev].filter((id) => idsValidos.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [contactos]);

  const abierto = contactos.find((c) => c.id === abiertoId);

  const todosFiltradosSeleccionados = filtrados.length > 0 && filtrados.every((c) => seleccionados.has(c.id));

  const toggleUno = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    setSeleccionados((prev) => {
      if (todosFiltradosSeleccionados) {
        const next = new Set(prev);
        filtrados.forEach((c) => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      filtrados.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const cancelarSeleccion = () => { setSeleccionados(new Set()); setGrupoIAAbierto(false); };

  const migrarSeleccionados = async () => {
    const ids = [...seleccionados];
    if (!ids.length) return;
    setProcesando(true);
    try {
      const { migrados } = await contactosApi.bulkMigrar(ids, marcaDestino);
      showToast(`${migrados} contacto${migrados === 1 ? "" : "s"} migrado${migrados === 1 ? "" : "s"} a ${marcaDestino}`);
      cancelarSeleccion();
      recargar();
    } catch (e) {
      showToast("Error al migrar: " + e.message);
    }
    setProcesando(false);
  };

  const eliminarSeleccionados = async () => {
    const ids = [...seleccionados];
    if (!ids.length) return;
    if (!window.confirm(`¿Eliminar ${ids.length} contacto${ids.length === 1 ? "" : "s"}? Esta acción no se puede deshacer.`)) return;
    setProcesando(true);
    try {
      const { eliminados } = await contactosApi.bulkRemove(ids);
      showToast(`${eliminados} contacto${eliminados === 1 ? "" : "s"} eliminado${eliminados === 1 ? "" : "s"}`);
      cancelarSeleccion();
      recargar();
    } catch (e) {
      showToast("Error al eliminar: " + e.message);
    }
    setProcesando(false);
  };

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Contactos</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Todos los contactos, de todas las marcas y segmentos.</p>

      <ImportarCSV marca={marcaImport} setMarca={setMarcaImport} onImportado={recargar} showToast={showToast} />
      <NuevoContactoManual marca={marcaImport} setMarca={setMarcaImport} onCreado={recargar} showToast={showToast} />

      <div className="flex gap-2 mb-3 flex-wrap">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nombre o empresa" className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }} />
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="text-sm rounded-md p-1.5" style={{ border: "1px solid #ddd" }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </select>
      </div>

      {seleccionados.size > 0 && (
        <BarraAcciones
          cantidad={seleccionados.size}
          marcaDestino={marcaDestino}
          setMarcaDestino={setMarcaDestino}
          onMigrar={migrarSeleccionados}
          onEliminar={eliminarSeleccionados}
          onGenerarIA={() => setGrupoIAAbierto(true)}
          onCancelar={cancelarSeleccion}
          procesando={procesando}
        />
      )}

      {grupoIAAbierto && seleccionados.size > 0 && (
        <GeneradorGrupoIA
          contactos={contactos.filter((c) => seleccionados.has(c.id))}
          onCerrar={() => setGrupoIAAbierto(false)}
          showToast={showToast}
        />
      )}

      <div className="overflow-auto rounded-xl" style={{ border: "1px solid #e4dfd3" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#faf9f6" }}>
              <th className="p-2 w-8">
                <input type="checkbox" checked={todosFiltradosSeleccionados} onChange={toggleTodos} />
              </th>
              {["Nombre", "Empresa", "Puesto", "Marca", "Estado", "Próx. seguimiento"].map((h) => (
                <th key={h} className="text-left p-2 text-xs" style={{ color: "#8a8578" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-sm" style={{ color: "#8a8578" }}>Sin contactos todavía. Cargá un CSV arriba.</td></tr>
            )}
            {filtrados.map((c) => {
              const col = ESTADO_COLOR[c.estado] || ESTADO_COLOR.nuevo;
              const marcado = seleccionados.has(c.id);
              return (
                <tr key={c.id} onClick={() => setAbiertoId(c.id)} className="cursor-pointer" style={{ borderTop: "1px solid #f0ece2", background: marcado ? "#f5f9ff" : (abiertoId === c.id ? "#faf9f6" : undefined) }}>
                  <td className="p-2" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={marcado} onChange={() => toggleUno(c.id)} />
                  </td>
                  <td className="p-2">{c.nombre}</td>
                  <td className="p-2" style={{ color: "#6b6759" }}>{c.empresa}</td>
                  <td className="p-2" style={{ color: "#6b6759" }}>{c.puesto}</td>
                  <td className="p-2" style={{ color: "#6b6759" }}>{c.marca_origen}</td>
                  <td className="p-2"><span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: col.bg, color: col.text }}>{labelEstado(c.estado)}</span></td>
                  <td className="p-2 text-xs" style={{ color: "#8a8578" }}>{c.proximo_seguimiento ? new Date(c.proximo_seguimiento).toLocaleString("es-AR") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {abierto && (
        <DetalleContacto
          contacto={abierto}
          segmentos={segmentos}
          onCerrar={() => setAbiertoId(null)}
          onActualizado={recargar}
          showToast={showToast}
        />
      )}
    </div>
  );
}
