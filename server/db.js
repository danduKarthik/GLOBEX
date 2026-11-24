// Tiny JSON-file database. Data lives in server/data/db.json
// (created automatically on first run). Swap for MongoDB/Postgres later if needed.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const EMPTY = { users: [], bookings: [] };

function ensure() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(EMPTY, null, 2));
  }
}

export function readDB() {
  ensure();
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    return { users: db.users || [], bookings: db.bookings || [] };
  } catch {
    return structuredClone(EMPTY);
  }
}

export function writeDB(db) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
