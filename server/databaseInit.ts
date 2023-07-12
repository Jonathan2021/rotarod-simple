import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { getDatabase } from './utils';

(async () => {
  // Open the database connection
  const db = await getDatabase();
  // Execute SQL queries to create tables

  console.log('Database and tables created successfully');
})();

