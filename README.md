# Tu Equipo IA — Next.js

App multi-usuario de "Tu Equipo IA": sidebar, login/signup, suscripción paga y 8 secciones (Dashboard, Organización, Estrategia, Marketing, Ventas, Finanzas, Equipo, Recursos). Cada suscriptor tiene su propia cuenta, su propia suscripción y sus propios datos.

## Stack

- **Next.js 16** (App Router)
- **Supabase** — Auth (login/signup) + Postgres (datos de cada usuario, con Row Level Security)
- **Anthropic API** — chat de los agentes y generación del plan de negocio (server-side, la key nunca se expone al cliente)
- **MercadoPago** — membresía única recurrente ($60.500 ARS/mes, IVA incluido)

## Setup local

```bash
npm install
cp .env.local.example .env.local   # completá las variables (ver abajo)
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Te va a redirigir a `/login` — creá una cuenta desde `/signup`.

### Variables de entorno

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API (publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API (secret key) — solo la usa el webhook de MercadoPago |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ANTHROPIC_MODEL` (opcional) | por defecto `claude-sonnet-4-5-20250929` |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago > Tus integraciones > Credenciales |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | MercadoPago > Tus integraciones > Credenciales |

## Autenticación, suscripción y datos por usuario

- `proxy.js` (antes `middleware.js` — Next.js 16 renombró la convención) protege todas las rutas en dos niveles:
  1. **Sesión**: si no hay usuario logueado, redirige a `/login`. Las rutas `/api/*` en cambio devuelven `401` en vez de redirigir.
  2. **Suscripción**: si el usuario está logueado pero no tiene una suscripción activa (ni está dentro del período de prueba de 7 días), redirige a `/suscripcion`.
- Tabla `profiles` (una fila por usuario, creada automáticamente por un trigger al hacer signup): guarda `subscription_status` (`trial` / `active` / `past_due` / `canceled`), `trial_ends_at` y `mercadopago_subscription_id`. Es lo único que gatea el acceso — no hay diferencias de funcionalidad entre usuarios, es membresía única.
- Tabla `app_data` (`user_id`, `key`, `value jsonb`) reemplaza al `data/store.json` de la primera versión. `lib/storage.js` mantiene la misma interfaz (`loadData(key, fallback)` / `saveData(key, value)`), así que ninguna sección tuvo que cambiar su lógica interna.
- Row Level Security en `app_data` y `profiles`: cada usuario solo puede leer/escribir sus propias filas (`auth.uid() = user_id`), garantizado a nivel de base de datos.

### Flujo de pago (MercadoPago)

1. El usuario entra a `/suscripcion` y hace click en "Suscribirme" → `POST /api/mercadopago/subscribe` crea una **suscripción (preapproval)** de $60.500/mes vía la API de MercadoPago, con `external_reference = user.id`, y devuelve `init_point` (la URL de checkout hosteada por MercadoPago).
2. El browser redirige a esa URL; el usuario carga su tarjeta ahí (no en nuestra app).
3. MercadoPago llama a `POST /api/mercadopago/webhook` cuando cambia el estado de la suscripción. El webhook **nunca confía en el payload**: vuelve a pedir el recurso completo a la API de MercadoPago por `id` y recién ahí actualiza `profiles.subscription_status` del usuario que corresponda (usando la `service_role key`, porque este llamado es servidor-a-servidor, sin sesión de usuario).
4. `back_url` lleva al usuario a `/suscripcion/resultado` mientras el webhook procesa el pago en paralelo.

**Importante:** MercadoPago necesita una URL pública HTTPS para el webhook — no funciona con `localhost`. El flujo de pago completo (checkout + webhook) recién se puede probar de punta a punta una vez deployado (ver abajo). Localmente se puede probar que las rutas respondan bien (401 sin sesión, etc.) pero no el pago real.

Arrancá probando con las credenciales **de prueba** de MercadoPago (`TEST-...`) antes de pasar a las de producción (`APP_USR-...`).

## Estructura

```
proxy.js                       # protección de rutas: sesión + suscripción activa
app/
  page.js                      # shell principal (sidebar + secciones)
  login/page.js
  signup/page.js
  suscripcion/page.js          # checkout de la membresía
  suscripcion/resultado/page.js
  layout.js
  api/
    storage/route.js           # GET/POST key-value en Supabase, scopeado por usuario
    chat/route.js               # proxy server-side a Anthropic (requiere sesión)
    mercadopago/subscribe/route.js   # crea la suscripción (preapproval)
    mercadopago/webhook/route.js     # recibe notificaciones de MercadoPago
components/
  Sidebar.jsx                   # incluye botón de cerrar sesión
  Onboarding.jsx
  ...
lib/
  supabase/client.js             # cliente browser
  supabase/server.js             # cliente server (respeta RLS, corre "como el usuario")
  supabase/admin.js              # cliente con secret key, bypassea RLS (solo webhook)
  mercadopago.js                 # llamados REST a la API de MercadoPago
  constants.js / helpers.js / storage.js / chat.js / businessContext.js
```

## Deploy a producción (Vercel)

1. Pusheá el repo a GitHub.
2. Importá el repo en Vercel.
3. Cargá las mismas variables de entorno de `.env.local` en Vercel (Project Settings > Environment Variables) — usá las credenciales de MercadoPago **de producción** para el sitio en vivo.
4. Deploy. Cada push a la rama principal genera un deploy nuevo automáticamente.
5. Una vez deployado, probá el flujo de suscripción completo con una tarjeta de prueba (si seguís con credenciales TEST) para confirmar que el webhook actualiza `profiles.subscription_status`.
