"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ENLACES = [
  { href: "/", texto: "Panel", activo: (p: string) => p === "/" },
  { href: "/mis-tickets", texto: "Mis tickets", activo: (p: string) => p.startsWith("/mis-tickets") },
  { href: "/tickets", texto: "Tickets", activo: (p: string) => p.startsWith("/tickets") },
  { href: "/inventario", texto: "Inventario", activo: (p: string) => p.startsWith("/inventario") },
  { href: "/conocimiento", texto: "Conocimiento", activo: (p: string) => p.startsWith("/conocimiento") || p.startsWith("/respuestas") },
  { href: "/portal", texto: "Portal", activo: (p: string) => p.startsWith("/portal") },
];

/** `misPendientes`: tickets pendientes del técnico actual, para el contador junto a «Mis tickets». */
export default function Navegacion({ className, misPendientes }: { className?: string; misPendientes: number }) {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className={cn("-mx-1 flex gap-5 overflow-x-auto px-1 sm:gap-6 lg:self-stretch lg:overflow-visible", className)}
    >
      {ENLACES.map((e) => {
        const activo = e.activo(ruta);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40",
              activo ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {e.texto}
            {e.href === "/mis-tickets" && misPendientes > 0 && (
              <span
                className="ml-1.5 rounded-full bg-primary-soft px-1.5 text-xs font-bold text-primary tabular-nums"
                aria-label={`${misPendientes} pendientes`}
              >
                {misPendientes}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
