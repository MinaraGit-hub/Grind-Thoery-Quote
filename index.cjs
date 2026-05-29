const path = require("path");
const fs = require("fs");

const entry = path.resolve(__dirname, "dist", "index.cjs");

if (!fs.existsSync(entry)) {
  console.error(
    "ERROR: dist/index.cjs not found. Please run `npm run build` before starting the app."
  );
  process.exit(1);
}

require(entry);
