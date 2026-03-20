import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function ensureEnvFile() {
  if (fs.existsSync(envPath)) {
    return;
  }

  if (!fs.existsSync(envExamplePath)) {
    throw new Error(".env.example not found");
  }

  fs.copyFileSync(envExamplePath, envPath);
  console.log("Created .env from .env.example");
}

function parseEnv(fileContent) {
  const env = {};

  for (const line of fileContent.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: mergedEnv,
    stdio: "inherit",
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveCreatedbCommand() {
  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";

    for (const version of [18, 17, 16, 15, 14, 13]) {
      const candidate = path.join(programFiles, "PostgreSQL", String(version), "bin", "createdb.exe");

      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return "createdb.exe";
  }

  return "createdb";
}

function ensureDatabase(databaseUrl, databaseName) {
  const createdbCommand = resolveCreatedbCommand();
  const username = decodeURIComponent(databaseUrl.username || process.env.USER || "postgres");
  const password = decodeURIComponent(databaseUrl.password || "");
  const host = databaseUrl.hostname || "localhost";
  const port = databaseUrl.port || "5432";
  const args = [
    "--host",
    host,
    "--port",
    port,
    "--username",
    username,
    databaseName
  ];

  const result = spawnSync(createdbCommand, args, {
    cwd: rootDir,
    env: {
      ...mergedEnv,
      ...(password ? { PGPASSWORD: password } : {})
    },
    encoding: "utf8"
  });

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

  if (result.error && result.error.code === "ENOENT") {
    throw new Error("createdb was not found. Install PostgreSQL client tools or add createdb to PATH.");
  }

  if (result.status === 0) {
    console.log(`Database \"${databaseName}\" created.`);
    return;
  }

  if (/already exists/i.test(output)) {
    console.log(`Database \"${databaseName}\" already exists.`);
    return;
  }

  if (/password authentication failed/i.test(output)) {
    process.stderr.write(output);
    console.error("Update DATABASE_URL in .env so it matches your local PostgreSQL username and password.");
    process.exit(result.status ?? 1);
  }

  process.stderr.write(output);
  process.exit(result.status ?? 1);
}

ensureEnvFile();

const parsedEnv = parseEnv(fs.readFileSync(envPath, "utf8"));
const mergedEnv = {
  ...process.env,
  ...parsedEnv
};

const databaseUrlRaw = mergedEnv.DATABASE_URL;

if (!databaseUrlRaw) {
  throw new Error("DATABASE_URL is missing in .env");
}

const databaseUrl = new URL(databaseUrlRaw);
const databaseName = databaseUrl.pathname.replace(/^\//, "");

if (!databaseName) {
  throw new Error("DATABASE_URL does not include a database name");
}

console.log(`Ensuring database \"${databaseName}\" exists...`);
ensureDatabase(databaseUrl, databaseName);

console.log("Generating Prisma client...");
run(pnpmCommand, ["prisma:generate"]);

console.log("Applying migrations...");
run(pnpmCommand, ["prisma:migrate"]);

console.log("Seeding demo data...");
run(pnpmCommand, ["seed"]);

console.log("Local setup complete.");
console.log("Run pnpm local:dev to start backend, frontend, and bot.");

