import { cookies } from "next/headers";
import { TECNICOS, esTecnico, type Tecnico } from "@/lib/dominio";

export const COOKIE_TECNICO = "tecnico";

/** Sin inicio de sesión: quien visita elige como qué técnico actúa (se guarda en una cookie). */
export async function tecnicoActual(): Promise<Tecnico> {
  const valor = (await cookies()).get(COOKIE_TECNICO)?.value;
  const nombre = valor ? decodeURIComponent(valor) : null;
  return esTecnico(nombre) ? nombre : TECNICOS[0];
}
