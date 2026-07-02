// Reemplaza al window.storage de los artifacts de Claude.
// Persiste cada key en Supabase vía /api/storage, scopeado por usuario Y
// por unidad de negocio (una empresa puede tener varias unidades, cada
// una con sus propios datos). En la mayoría de los componentes no se usa
// esto directo — se usa el hook useUnidadStorage(), que ya viene con la
// unidad actual "atada" y tiene la misma firma que estas dos funciones.

export async function loadData(key, fallback, unidadId) {
  if (!unidadId) return fallback;
  try {
    const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}&unidadId=${encodeURIComponent(unidadId)}`);
    if (!res.ok) return fallback;
    const data = await res.json();
    return data?.value !== undefined && data?.value !== null ? data.value : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function saveData(key, value, unidadId) {
  if (!unidadId) return;
  try {
    await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, unidadId }),
    });
  } catch (e) {
    // silencioso, igual que el original
  }
}
