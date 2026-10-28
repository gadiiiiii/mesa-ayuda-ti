CREATE TABLE "reglas_asignacion" (
	"categoria" text PRIMARY KEY NOT NULL,
	"modo" text DEFAULT 'cola' NOT NULL,
	"tecnico" text
);
--> statement-breakpoint
CREATE TABLE "tecnicos" (
	"nombre" text PRIMARY KEY NOT NULL,
	"disponible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
-- Reglas iniciales (las mismas de REGLAS_INICIALES en lib/dominio.ts): redes y telefonía al especialista,
-- cuentas a quien administra el dominio, hardware e impresoras por carga; software y otros a la cola.
INSERT INTO "tecnicos" ("nombre") VALUES ('Camila Rojas'), ('Diego Fuentes'), ('Valentina Soto') ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "reglas_asignacion" ("categoria", "modo", "tecnico") VALUES
  ('red', 'tecnico', 'Diego Fuentes'),
  ('cuentas', 'tecnico', 'Camila Rojas'),
  ('impresoras', 'menos_carga', NULL),
  ('hardware', 'menos_carga', NULL),
  ('software', 'cola', NULL),
  ('telefonia', 'tecnico', 'Diego Fuentes'),
  ('otro', 'cola', NULL)
ON CONFLICT DO NOTHING;
