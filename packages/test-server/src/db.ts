import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Open the SQLite DB (creates `database.db` if it doesn’t exist)
const dbPromise = open({
  filename: 'database.db',
  driver: sqlite3.Database,
});

const createLoopbackTableSQL = `\
CREATE TABLE IF NOT EXISTS loopback_recordings (
id TEXT,
user_agent TEXT,
signal TEXT,
created_at TEXT,
file_path TEXT
)\
`;

// Initialize the table
async function initDB() {
  const db = await dbPromise;
  await db.exec(createLoopbackTableSQL);
}

initDB();

export interface loopbackTableData {
  id: string;
  user_agent: string;
  signal: string;
  created_at?: string;
  file_path?: string;
}

function addDollarKeys(obj: object) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [`$${k}`, v]));
}

export async function saveLoopbackData(
  data: loopbackTableData,
): Promise<loopbackTableData> {
  if (!data.created_at) {
    data.created_at = new Date().toISOString();
  }

  if (!data.file_path) {
    data.file_path = `${data.id}.wav`;
  }

  const db = await dbPromise;

  const insertSQL =
    'INSERT INTO loopback_recordings (id, user_agent, signal, created_at, file_path) VALUES ($id, $user_agent, $signal, $created_at, $file_path)';

  console.log(data);

  await db.run(insertSQL, addDollarKeys(data));

  return data;
}

export async function getData() {
  const db = await dbPromise;
  return db.all('SELECT * FROM test_data');
}
