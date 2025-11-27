import * as SQLite from 'expo-sqlite';

import { nowIso } from '@/utils/date';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const createTablesSQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER,
    date TEXT,
    time TEXT,
    repeatDaily INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    avatar TEXT,
    settingsJson TEXT
  );
`;

export const getDb = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('todocup.db');
      await db.execAsync(createTablesSQL);
      return db;
    })();
  }
  return dbPromise;
};

export const initializeDatabase = async () => {
  await getDb();
};

export const run = async (sql: string, params: SQLite.SQLiteBindParams = []) => {
  const db = await getDb();
  return db.runAsync(sql, params);
};

export const getAll = async <T>(sql: string, params: SQLite.SQLiteBindParams = []) => {
  const db = await getDb();
  return db.getAllAsync<T>(sql, params);
};

export const getFirst = async <T>(sql: string, params: SQLite.SQLiteBindParams = []) => {
  const db = await getDb();
  return db.getFirstAsync<T>(sql, params);
};

export const withTransaction = async <T>(fn: (db: SQLite.SQLiteDatabase) => Promise<any>) => {
  const db = await getDb();
  return db.withTransactionAsync(async () => fn(db));
};

export const touchTimestamp = () => nowIso();
