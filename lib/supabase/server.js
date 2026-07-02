import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de Supabase para usar en Server Components y Route Handlers.
// Corre "como el usuario" (respeta RLS) leyendo la sesión de las cookies,
// así que no hace falta manejar la service_role key en el server.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (e) {
            // se puede ignorar si se llama desde un Server Component;
            // el middleware se encarga de refrescar la sesión igual.
          }
        },
      },
    }
  );
}
