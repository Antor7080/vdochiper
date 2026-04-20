import path from 'path';
import { JsonDatabase } from './JsonDatabase';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Singleton — one writer, one file, no race conditions within the process
export const db = new JsonDatabase(DB_PATH);

console.log(`[DB] JSON database loaded from ${DB_PATH}`);
