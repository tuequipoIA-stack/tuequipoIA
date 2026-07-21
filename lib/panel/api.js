// Cliente delgado para las rutas /api/panel/* — reemplaza el
// localStorage.getItem/setItem del artifact original por fetch a Supabase.

async function j(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error de red");
  return data;
}

export const leadsApi = {
  list: (proyecto) => fetch(`/api/panel/leads${proyecto ? `?proyecto=${proyecto}` : ""}`).then(j).then((d) => d.leads),
  create: (lead) => fetch("/api/panel/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) }).then(j).then((d) => d.lead),
  update: (id, patch) => fetch(`/api/panel/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).then(j).then((d) => d.lead),
  remove: (id) => fetch(`/api/panel/leads/${id}`, { method: "DELETE" }).then(j),
};

export const cobrosApi = {
  list: () => fetch("/api/panel/cobros").then(j).then((d) => d.cobros),
  create: (cobro) => fetch("/api/panel/cobros", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cobro) }).then(j).then((d) => d.cobro),
  update: (id, patch) => fetch(`/api/panel/cobros/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).then(j).then((d) => d.cobro),
  remove: (id) => fetch(`/api/panel/cobros/${id}`, { method: "DELETE" }).then(j),
};

export const listasApi = {
  list: () => fetch("/api/panel/listas").then(j).then((d) => d.listas),
  create: (lista) => fetch("/api/panel/listas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lista) }).then(j).then((d) => d.lista),
  update: (id, patch) => fetch(`/api/panel/listas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).then(j).then((d) => d.lista),
  remove: (id) => fetch(`/api/panel/listas/${id}`, { method: "DELETE" }).then(j),
};

export const enviadosApi = {
  list: () => fetch("/api/panel/enviados").then(j).then((d) => d.enviados),
  create: (leadId, canal, listaId) => fetch("/api/panel/enviados", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, canal, listaId }) }).then(j),
  removeByLead: (leadId, canal) => fetch(`/api/panel/enviados?leadId=${leadId}&canal=${canal}`, { method: "DELETE" }).then(j),
};

export const checklistApi = {
  list: () => fetch("/api/panel/checklist").then(j).then((d) => d.checklist),
  save: (proyecto, items) => fetch("/api/panel/checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proyecto, items }) }).then(j).then((d) => d.checklist),
};
