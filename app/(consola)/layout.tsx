import BarraSuperior from "@/app/_componentes/BarraSuperior";

/** La consola de los técnicos: panel, tickets e inventario. */
export default function LayoutConsola({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BarraSuperior />
      <main id="principal" className="mx-auto max-w-[76rem] px-4 pt-6 pb-16 sm:px-6">
        {children}
      </main>
    </>
  );
}
