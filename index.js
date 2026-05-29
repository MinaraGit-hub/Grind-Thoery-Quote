import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entry = path.resolve(__dirname, "dist", "index.cjs");

if (!fs.existsSync(entry)) {
  console.error(
    "ERROR: dist/index.cjs not found. Please run `npm run build` before starting the app."
  );
  process.exit(1);
}

const { createRequire } = await import("module");
const require = createRequire(import.meta.url);
require(entry);
