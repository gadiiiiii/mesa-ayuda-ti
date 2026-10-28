ALTER TABLE "eventos" ADD COLUMN "publico" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "origen" text DEFAULT 'mesa' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "codigo" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_codigo_unique" UNIQUE("codigo");--> statement-breakpoint
-- Códigos de seguimiento para los tickets que ya existían.
UPDATE "tickets" SET "codigo" = upper(substr(md5(random()::text || "id"::text), 1, 4) || '-' || substr(md5(random()::text || "id"::text), 1, 4)) WHERE "codigo" IS NULL;--> statement-breakpoint
-- Lo que ve el solicitante: la creación, los cambios de estado (con su nota) y quién lo atiende.
UPDATE "eventos" SET "publico" = true WHERE "tipo" IN ('creado', 'estado', 'asignacion');
