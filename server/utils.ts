import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

export const dbPath = path.join(__dirname, 'database', 'myDatabase.db');

let dbInstance: Database | null = null;

export const getDatabase = async (): Promise<Database> => {
    if (dbInstance === null) {
        dbInstance = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
    }
    
    return dbInstance;
};

export const closeDatabase = async (): Promise<void> => {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
    }
};

export const isUniqueConstraintError = function (error) { return (error.code === "SQLITE_CONSTRAINT") };
