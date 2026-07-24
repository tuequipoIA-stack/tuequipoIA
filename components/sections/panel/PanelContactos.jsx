"use client";

import { useMemo, useState } from "react";
import { BRAND } from "@/lib/constants";
import { PROJECTS, ESTADOS } from "@/lib/panel/constants";
import LeadsTable from "@/components/sections/panel/LeadsTable";

const CSV_HEADERS = ["Nombre", "Empresa", "Rubro", "Proyecto", "Canal", "Teléfono", "Mail", "Próxima acción", "Estado", "Notas"];

function csvField(v) {
  v = v === undefined || v === null ? "" : String(v);
  if (/[",\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

function downloadTemplate() {
  const example = ["Juan Pérez", "Inmobiliaria del Sur", "Inmobiliaria", "Apps a Medida", "WhatsApp", "5491122334455", "juan@inmobiliariadelsur.com", "2026-07-25", "Nuevo", "Ejemplo - podés borrar esta fila"];
  const csv = `${CSV_HEADERS.map(csvField).join(",")}\n${example.map(csvField).join(",")}\n`;
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_contactos.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

function proyectoKeyFromLabel(label) {
  label = (label || "").trim().toLowerCase();
  if (label.includes("membres") || label.includes("equipo ia")) return "ia";
  return "apps";
}
function canalKeyFromLabel(label, proyectoKey) {
  label = (label || "").trim().toLowerCase();
  if (label.includes("insta")) return "instagram";
  if (label.includes("whats")) return "whatsapp";
  if (label.includes("mail") || label.includes("correo")) return "email";
  return PROJECTS[proyectoKey].canales[0];
}
function estadoFromLabel(label) {
  label = (label || "").trim();
  return ESTADOS.find((e) => e.toLowerCase() === label.toLowerCase()) || "Nuevo";
}

function parseLeadsFromCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) return { leads: [], skipped: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name) => header.indexOf(name);
  const iNombre = idx("nombre"), iEmpresa = idx("empresa"), iRubro = idx("rubro"),
    iProyecto = idx("proyecto"), iCanal = idx("canal"),
    iTelefono = header.indexOf("teléfono") !== -1 ? header.indexOf("teléfono") : idx("telefono"),
    iMail = idx("mail") !== -1 ? idx("mail") : idx("email"),
    iProxima = header.findIndex((h) => h.includes("próxima") || h.includes("proxima")),
    iEstado = idx("estado"), iNotas = idx("notas");

  const leads = [];
  let skipped = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const nombre = iNombre !== -1 ? (row[iNombre] || "").trim() : "";
    if (!nombre || (row.length === 1 && row[0].trim() === "")) { skipped++; continue; }
    const proyecto = proyectoKeyFromLabel(iProyecto !== -1 ? row[iProyecto] : "");
    const canal = canalKeyFromLabel(iCanal !== -1 ? row[iCanal] : "", proyecto);
    leads.push({
      proyecto,
      nombre,
      empresa: iEmpresa !== -1 ? (row[iEmpresa] || "").trim() : "",
      rubro: iRubro !== -1 ? (row[iRubro] || "").trim() : "",
      canal,
      telefono: iTelefono !== -1 ? (row[iTelefono] || "").trim() : "",
      mail: iMail !== -1 ? (row[iMail] || "").trim() : "",
      proximaAccion: iProxima !== -1 ? (row[iProxima] || "").trim() || null : null,
      estado: iEstado !== -1 ? estadoFromLabel(row[iEstado]) : "Nuevo",
      notas: iNotas !== -1 ? (row[iNotas] || "").trim() : "",
    });
  }
  return { leads, skipped };
}

export default function PanelContactos({ leads, actualizarLead, eliminarLead, enviarASeguimiento, importarLeads, showToast }) {
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [importando, setImportando] = useState(false);

  const filtrados = useMemo(() => leads.filter((l) =>
    (!filtroProyecto || l.proyecto === filtroProyecto) &&
    (!filtroEstado || l.estado === filtroEstado) &&
    (!busqueda || l.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  ), [leads, filtroProyecto, filtroEstado, busqueda]);

  const onImportar = async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    setImportando(true);
    try {
      const text = await file.text();
      const { leads: nuevos, skipped } = parseLeadsFromCSV(text);
      if (!nuevos.length) { showToast("El archivo está vacío o no tiene filas válidas"); return; }
      const cantidad = await importarLeads(nuevos);
      showToast(`${cantidad} contacto(s) importado(s)${skipped ? `, ${skipped} fila(s) omitida(s)` : ""}`);
    } finally {
      setImportando(false);
      ev.target.value = "";
    }
  };

  return (
    <div>
      <div className="rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div>
          <div style={{ color: BRAND.navy }} className="text-sm font-bold">Importar / exportar contactos</div>
          <div style={{ color: "#8a8578" }} className="text-xs mt-0.5">Descargá la plantilla, completala en Excel y subila acá como CSV para cargar varios contactos de una vez.</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate} className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "#eee9dd", color: "#6b6759" }}>Descargar plantilla CSV</button>
          <label
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${importando ? "cursor-wait opacity-70" : "cursor-pointer"}`}
            style={{ background: "#eee9dd", color: "#6b6759" }}
          >
            {importando ? "Importando..." : "Importar CSV"}
            <input type="file" accept=".csv" hidden onChange={onImportar} disabled={importando} />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <select value={filtroProyecto} onChange={(e) => setFiltroProyecto(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }}>
          <option value="">Todos los proyectos</option>
          <option value="ia">Membresías</option>
          <option value="apps">Apps a Medida</option>
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre..." className="rounded-lg px-2.5 py-1.5 text-sm" style={{ border: "1px solid #e4dfd3" }} />
      </div>

      <LeadsTable
        leads={filtrados}
        onEstadoChange={(id, estado) => actualizarLead(id, { estado })}
        onProximaAccionChange={(id, proximaAccion) => actualizarLead(id, { proximaAccion })}
        onDelete={eliminarLead}
        onEnviarSeguimiento={enviarASeguimiento}
      />
    </div>
  );
}
