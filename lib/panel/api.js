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
