import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

/**
 * Gera os arquivos servidos por backend/app.py em /static/js/.
 *
 * Formato ESM com `splitting` para que a cena 3D (three.js + R3F) saia em um
 * chunk separado, carregado sob demanda apenas na página inicial.
 */
const options = {
  entryPoints: [path.join(dir, "src/index.jsx")],
  bundle: true,
  outdir: path.join(dir, "static/js"),
  entryNames: "bundle",
  assetNames: "assets/[name]-[hash]",
  chunkNames: "chunks/[name]-[hash]",
  format: "esm",
  splitting: true,
  target: ["es2020"],
  jsx: "automatic",
  loader: { ".js": "jsx", ".jsx": "jsx" },
  minify: !watch,
  sourcemap: watch,
  logLevel: "info",
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  alias: { "@": path.join(dir, "src") },
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("esbuild em modo watch");
} else {
  await esbuild.build(options);
  console.log("build concluído");
}
