import "./globals.css";

export const metadata = {
  title: "Tu Equipo IA",
  description: "Suscripción mensual para emprendedores que recién arrancan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
