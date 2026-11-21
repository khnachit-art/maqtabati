const { execSync, spawn } = require("child_process");
const path = require("path");

const cwd = String.raw`C:\Users\PC-PJD\Documents\Default Project\book-orders`;
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");

const child = spawn("node", [nextBin, "dev", "--webpack", "-p", "3000"], {
  cwd,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code));
