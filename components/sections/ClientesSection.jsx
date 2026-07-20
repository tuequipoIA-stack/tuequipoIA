"use client";

import { useEffect, useState } from "react";
import { Mail, Pencil, Phone, Plus, Search, Trash2, Users } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { uid } from "@/lib/helpers";
import AudioAyuda from "@/components/AudioAyuda";
import { AUDIO_GUIONES, AUDIO_ARCHIVOS } from "@/lib/audioGuiones";
import ClienteModal from "@/components/ClienteModal";

export default function ClientesSection() {
  const { loadData, saveData, unidadId } = useUnidadStorage();
  const [clientes, setClientes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    if (!unidadId) return;
    setLoaded(false);
    loadData("clientes-registro", []).then((d) => { setClientes(d); setLoaded(true); });
  }, [unidadId]);

  const guardar = async (datos) => {
    let actualizado;
    if (datos.id) {
      actualizado = clientes.map((c) => (c.id === datos.id ? { ...c, ...datos } : c));
    } else {
      actualizado = [{ ...datos, id: uid() }, ...clientes];
    }
    setClientes(actualizado);
    await saveData("clientes-registro", actualizado);
    setModalAbierto(false);
    setEditando(null);
  };

  const eliminar = async (id) => {
    const actualizado = clientes.filter((c) => c.id !== id);
    setClientes(actualizado);
    await saveData("clientes-registro", actualizado);
  };

  const abrirNuevo = () => { setEditando(null); setModalAbierto(true); };
  const abrirEditar = (c) => { setEditando(c); setModalAbierto(true); };

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? clientes.filter((c) =>
        (c.nombre || "").toLowerCase().includes(q) ||
        (c.telefono || "").toLowerCase().includes(q) ||
        (c.correo || "").toLowerCase().includes(q)
      )
    : clientes;

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold">Clientes</h2>
        <AudioAyuda texto={AUDIO_GUIONES.clientes} audioSrc={AUDIO_ARCHIVOS.clientes} />
      </div>
      <p style={{ color: "#6b6759" }} className="text-sm mb-4">Todos tus clientes, en un solo lugar.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={14} color="#a89f88" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, teléfono o correo..."
            className="rounded-lg pl-9 pr-3 py-2 text-sm outline-none w-full" style={{ border: "1px solid #e4dfd3" }} />
        </div>
        <button onClick={abrirNuevo} className="rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1.5 justify-center shrink-0"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          <Plus size={14} /> Nuevo cliente
        </button>
      </div>

      {loaded && clientes.length === 0 && (
        <div className="rounded-xl p-6 text-center mb-4" style={{ background: "#ffffff", border: "1px dashed #d8d2c3" }}>
          <Users size={20} color="#b3ab98" className="mx-auto mb-2" />
          <p style={{ color: "#8a8578" }} className="text-sm">Todavía no cargaste clientes.</p>
        </div>
      )}

      {loaded && clientes.length > 0 && filtrados.length === 0 && (
        <p style={{ color: "#a89f88" }} className="text-sm mb-4">No hay clientes que coincidan con &quot;{busqueda}&quot;.</p>
      )}

      {filtrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((c) => (
            <div key={c.id} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span style={{ color: BRAND.navy }} className="text-sm font-semibold break-words">{c.nombre}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => abrirEditar(c)} style={{ color: "#6b6759" }}><Pencil size={13} /></button>
                  <button onClick={() => eliminar(c.id)} style={{ color: "#b3453f" }}><Trash2 size={13} /></button>
                </div>
              </div>
              {c.telefono && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Phone size={12} color="#a89f88" />
                  <span style={{ color: "#6b6759" }} className="text-xs">{c.telefono}</span>
                </div>
              )}
              {c.correo && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Mail size={12} color="#a89f88" />
                  <span style={{ color: "#6b6759" }} className="text-xs break-all">{c.correo}</span>
                </div>
              )}
              {c.anotaciones && (
                <p style={{ color: "#8a8578", borderTop: "1px solid #f0ece2" }} className="text-xs mt-2 pt-2 line-clamp-3">
                  {c.anotaciones}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <ClienteModal
        open={modalAbierto}
        initial={editando}
        onClose={() => { setModalAbierto(false); setEditando(null); }}
        onSave={guardar}
      />
    </div>
  );
}
