import type { NextConfig } from "next";

const config: NextConfig = {
  // PGlite carga archivos WebAssembly propios: no hay que empaquetarlo.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default config;
