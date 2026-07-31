// Cliente delgado para las rutas /api/panel/* del nuevo Panel de
// Prospección (contactos + segmentos + interacciones).

async function j(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de red");
  return data;
}

export const contactosApi = {
  list: () => fetch("/api/panel/contactos").then(j).then((d) => d.contactos),
  create: (contacto) =>
    fetch("/api/panel/contactos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactos: [contacto] }),
    }).then(j),
  bulkImport: (contactos, marca) =>
    fetch("/api/panel/contactos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactos, marca }),
    }).then(j),
  update: (id, patch) =>
    fetch(`/api/panel/contactos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(j).then((d) => d.contacto),
  remove: (id) => fetch(`/api/panel/contactos/${id}`, { method: "DELETE" }).then(j),
  bulkMigrar: (ids, marca) =>
    fetch("/api/panel/contactos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, marca }),
    }).then(j),
  bulkRemove: (ids) =>
    fetch("/api/panel/contactos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then(j),
  generarGrupo: ({ ids, trigger_event, objetivo }) =>
    fetch("/api/panel/contactos/generar-grupo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, trigger_event, objetivo }),
    }).then(j),
};

export const segmentosApi = {
  list: () => fetch("/api/panel/segmentos").then(j).then((d) => d.segmentos),
  update: (id, patch) =>
    fetch(`/api/panel/segmentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(j).then((d) => d.segmento),
  generar: (id) =>
    fetch(`/api/panel/segmentos/${id}/generar`, { method: "POST" }).then(j).then((d) => d.segmento),
  enviar: (id) =>
    fetch(`/api/panel/segmentos/${id}/enviar`, { method: "POST" }).then(j),
};

export const gruposSegmentosApi = {
  list: () => fetch("/api/panel/grupos-segmentos").then(j).then((d) => d.grupos),
  create: (nombre, segmento_ids) =>
    fetch("/api/panel/grupos-segmentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, segmento_ids }),
    }).then(j).then((d) => d.grupo),
  remove: (id) => fetch(`/api/panel/grupos-segmentos/${id}`, { method: "DELETE" }).then(j),
};

export const interaccionesApi = {
  list: (contactoId) =>
    fetch(`/api/panel/interacciones?contacto_id=${contactoId}`).then(j).then((d) => d.interacciones),
  create: (interaccion) =>
    fetch("/api/panel/interacciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(interaccion),
    }).then(j).then((d) => d.interaccion),
};
