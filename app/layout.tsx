import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
// Fuentes servidas desde la propia app (sin pedirlas a Google): solo latín.
import "@fontsource-variable/public-sans/index.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";

// Todo se lee de la base de datos en cada visita.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Mesa de ayuda TI", template: "%s · Mesa de ayuda TI" },
  description: "Tickets de soporte con plazos por prioridad e inventario de equipos de una oficina municipal.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e9edf0" },
    { media: "(prefers-color-scheme: dark)", color: "#101418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:font-semibold"
        >
          Saltar al contenido
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
