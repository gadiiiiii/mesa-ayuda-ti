CREATE TABLE "articulos" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"categoria" text NOT NULL,
	"contenido" text NOT NULL,
	"publico" boolean DEFAULT true NOT NULL,
	"autor" text NOT NULL,
	"ticket_id" integer,
	"utiles" integer DEFAULT 0 NOT NULL,
	"no_utiles" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respuestas" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"texto" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articulos" ADD CONSTRAINT "articulos_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "articulos_busqueda_idx" ON "articulos" USING gin (to_tsvector('spanish', "titulo" || ' ' || "contenido"));