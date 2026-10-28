"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ENLACES = [
  { href: "/", texto: "Panel", activo: (p: string) => p === "/" },
  { href: "/tickets", texto: "Tickets", activo: (p: string) => p.startsWith("/tickets") },
  { href: "/inventario", texto: "Inventario", activo: (p: string) => p.startsWith("/inventario") },
];

export default function Navegacion({ className }: { className?: string }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones" className={cn("flex gap-6 lg:self-stretch", className)}>
      {ENLACES.map((e) => {
        const activo = e.activo(ruta);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center border-b-[3px] font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40",
              activo ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
