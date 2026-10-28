CREATE TABLE "mantenciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipo_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"programada_para" date NOT NULL,
	"cada_meses" integer,
	"realizada_en" timestamp with time zone,
	"realizada_por" text,
	"nota" text,
	"creada_por" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimientos" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipo_id" integer NOT NULL,
	"campo" text NOT NULL,
	"desde" text,
	"hacia" text,
	"autor" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equipos" ADD COLUMN "garantia_hasta" date;--> statement-breakpoint
ALTER TABLE "mantenciones" ADD CONSTRAINT "mantenciones_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mantenciones_equipo_idx" ON "mantenciones" USING btree ("equipo_id");--> statement-breakpoint
CREATE INDEX "movimientos_equipo_idx" ON "movimientos" USING btree ("equipo_id");