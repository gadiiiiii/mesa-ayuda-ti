import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/esquema.ts",
  out: "./drizzle",
});
