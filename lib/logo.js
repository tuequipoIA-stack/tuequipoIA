// El logo de cada negocio se guarda en el bucket público "logos" de
// Supabase Storage, en la ruta {user_id}/logo. Como el bucket es público,
// no hace falta pedir una URL firmada: alcanza con armar la URL pública.
// `updatedAt` es solo para invalidar el cache del browser después de subir uno nuevo.
export function logoUrl(userId, updatedAt) {
  if (!userId) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = `${base}/storage/v1/object/public/logos/${userId}/logo`;
  return updatedAt ? `${url}?t=${updatedAt}` : url;
}
