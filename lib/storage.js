// Reemplaza al window.storage de los artifacts de Claude.
// Persiste cada key en un archivo JSON del proyecto vía /api/storage.
// (En el original el segundo argumento de window.storage.get/set indicaba
// si el dato era "compartido" entre usuarios; acá la app es de un solo
// negocio por instancia, así que no hace falta esa distinción.)

export async function loadData(key, fallback) {
  try {
    const res = await fetch(`/api/storage?key=${encodeURIComponent(key)}`);
    if (!res.ok) return fallback;
    const data = await res.json();
    return data?.value !== undefined && data?.value !== null ? data.value : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function saveData(key, value) {
  try {
    await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch (e) {
    // silencioso, igual que el original
  }
}
