// Un solo lugar para decidir si alguien tiene acceso real a la app: admin,
// o suscripción activa, o todavía dentro de la prueba gratis. Se usa en
// las rutas del servidor para que un usuario sin acceso no pueda leer ni
// escribir nada (tareas, ventas, productos, recursos, etc.) aunque intente
// llamar a la API directamente, sin pasar por la pantalla grisada.
export function tieneAccesoActivo(profile) {
  if (!profile) return false;
  if (profile.is_admin) return true;
  if (profile.subscription_status === "active") return true;
  if (profile.subscription_status === "trial" && profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
    return true;
  }
  return false;
}

export const SIN_ACCESO_ERROR = "Tu suscripción no está activa. Regularizala desde Perfil para volver a usar la app.";
