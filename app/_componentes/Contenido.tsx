import { bloques } from "@/lib/conocimiento";
import TextoConEnlaces from "./TextoConEnlaces";

/** El texto de un artículo: párrafos y listas, sin HTML (React escapa todo). */
export default function Contenido({ texto }: { texto: string }) {
  return (
    <div className="flex max-w-[70ch] flex-col gap-3 leading-7">
      {bloques(texto).map((b, i) =>
        b.tipo === "parrafo" ? (
          <p key={i}>
            <TextoConEnlaces texto={b.texto} />
          </p>
        ) : b.tipo === "numerada" ? (
          <ol key={i} className="list-decimal space-y-1 pl-6 marker:font-semibold marker:text-muted-foreground">
            {b.items.map((x, j) => (
              <li key={j}>
                <TextoConEnlaces texto={x} />
              </li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="list-disc space-y-1 pl-6 marker:text-muted-foreground">
            {b.items.map((x, j) => (
              <li key={j}>
                <TextoConEnlaces texto={x} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
