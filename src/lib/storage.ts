import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const dataDirectory = process.env.DATA_DIRECTORY || path.join(process.cwd(), "data");
export const uploadsDirectory = process.env.UPLOAD_DIRECTORY || path.join(process.cwd(), "public", "uploads");

// Refuse an accidentally copied storage path before opening or writing any files.
for (const directory of [dataDirectory, uploadsDirectory]) {
  if (/kidsbathbuddy/i.test(directory)) throw new Error("Baby Bath Ease requires its own storage directories.");
}

export function uploadPath(folder: string, filename: string) {
  const persistent = path.join(uploadsDirectory, folder, filename);
  return fs.existsSync(persistent) ? persistent : path.join(process.cwd(), "public", "uploads", folder, filename);
}

export function initializeDatabaseFile(databasePath: string) {
  if (fs.existsSync(databasePath)) return;
  const seed = process.env.DATABASE_SEED_FILE;
  if (!seed) return;
  const key = process.env.DATABASE_SEED_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error("Database migration key is missing or invalid.");
  const encrypted = fs.readFileSync(seed);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), encrypted.subarray(0, 12));
  decipher.setAuthTag(encrypted.subarray(12, 28));
  const bytes = Buffer.concat([decipher.update(encrypted.subarray(28)), decipher.final()]);
  if (bytes.subarray(0, 16).toString() !== "SQLite format 3\0") throw new Error("Invalid database migration file.");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const temporary = `${databasePath}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporary, bytes, { mode: 0o600, flag: "wx" });
  try {
    // Atomic first-run installation; never replace an existing live database.
    fs.linkSync(temporary, databasePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  } finally {
    fs.unlinkSync(temporary);
  }
}
