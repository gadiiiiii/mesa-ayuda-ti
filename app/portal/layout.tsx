import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "Pedir ayuda a Informática", template: "%s · Informática" },
  description: "Pide ayuda a Informática y revisa en qué va tu solicitud.",
};

/** El portal para funcionarios: una cabecera simple, sin la navegación de los técnicos. */
export default function LayoutPortal({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[60rem] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 sm:px-6">
          <Link href="/portal" className="flex items-center gap-2 py-1 font-bold">
            <svg viewBox="0 0 24 24" className="size-6 text-primary" aria-hidden="true">
              <rect x="3" y="4" width="18" height="12" rx="2" className="fill-none stroke-current" strokeWidth="2" />
              <path d="M8 20h8M12 16v4" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
              <path d="M8.5 10l2 2 4-4" className="fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Informática
          </Link>
          <nav aria-label="Portal" className="flex gap-5 text-sm font-semibold">
            <Link href="/portal/seguimiento" className="inline-flex min-h-11 items-center text-primary hover:underline">
              Revisar mi solicitud
            </Link>
            <Link href="/" className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground hover:underline">
              Soy técnico
            </Link>
          </nav>
        </div>
      </header>
      <main id="contenido" className="mx-auto max-w-[60rem] px-4 pt-8 pb-16 sm:px-6">
        {children}
      </main>
    </>
  );
}
