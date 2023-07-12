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

// Mouse

export const getMice = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Mouse"`);
};

export const getMouse = async (mouseId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Mouse" WHERE id = ?`, mouseId);
};

export const createMouse = async (cageId, ucbIdentifier, zigosity) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Mouse" (cage_id, ucb_identifier, zigosity)
    VALUES (?, ?, ?)
  `, cageId, ucbIdentifier, zigosity);

  return result.lastID;
};

export const updateMouse = async (id, cageId, ucbIdentifier, zigosity) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Mouse"
    SET cage_id = ?, ucb_identifier = ?, zigosity = ?
    WHERE id = ?
  `, cageId, ucbIdentifier, zigosity, id);
};

export const deleteMouse = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Mouse"
    WHERE id = ?
  `, id);
};

// Cage

export const getCages = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Cage"`);
};

export const getCage = async (cageId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Cage" WHERE id = ?`, cageId);
};

export const createCage = async (cageNb) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Cage" (cage_nb)
    VALUES (?)
  `, cageNb);

  return result.lastID;
};

export const updateCage = async (id, cageNb) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Cage"
    SET cage_nb = ?
    WHERE id = ?
  `, cageNb, id);
};

export const deleteCage = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Cage"
    WHERE id = ?
  `, id);
};

// Run

export const getRuns = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Run"`);
};

export const getRun = async (runId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Run" WHERE id = ?`, runId);
};

export const createRun = async (constantSpeed, experimentator, day, acclimatation, temperature, humidity, lux, other) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Run" (constant_speed, experimentator, day, acclimatation, temperature, humidity, lux, other)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, constantSpeed, experimentator, day, acclimatation, temperature, humidity, lux, other);

  return result.lastID;
};

export const updateRun = async (id, constantSpeed, experimentator, day, acclimatation, temperature, humidity, lux, other) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Run"
    SET constant_speed = ?, experimentator = ?, day = ?, acclimatation = ?, temperature = ?, humidity = ?, lux = ?, other = ?
    WHERE id = ?
  `, constantSpeed, experimentator, day, acclimatation, temperature, humidity, lux, other, id);
};

export const deleteRun = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Run"
    WHERE id = ?
  `, id);
};

// Run_Ordering

export const getRunOrderings = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Run_Ordering"`);
};

export const getRunOrdering = async (cageId, runId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Run_Ordering" WHERE cage_id = ? AND run_id = ?`, cageId, runId);
};

export const createRunOrdering = async (cageId, runId, order) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Run_Ordering" (cage_id, run_id, order)
    VALUES (?, ?, ?)
  `, cageId, runId, order);

  return { cage_id: cageId, run_id: runId }; // In this case, these two values form the primary key
};

export const updateRunOrdering = async (cageId, runId, order) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Run_Ordering"
    SET order = ?
    WHERE cage_id = ? AND run_id = ?
  `, order, cageId, runId);
};

export const deleteRunOrdering = async (cageId, runId) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Run_Ordering"
    WHERE cage_id = ? AND run_id = ?
  `, cageId, runId);
};

// Trial

export const getTrials = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Trial"`);
};

export const getTrial = async (trialId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Trial" WHERE id = ?`, trialId);
};

export const createTrial = async (runId, trialNb) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Trial" (run_id, trial_nb)
    VALUES (?, ?)
  `, runId, trialNb);

  return result.lastID;
};

export const updateTrial = async (id, runId, trialNb) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Trial"
    SET run_id = ?, trial_nb = ?
    WHERE id = ?
  `, runId, trialNb, id);
};

export const deleteTrial = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Trial"
    WHERE id = ?
  `, id);
};

// Trial_record

export const getTrialRecords = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Trial_record"`);
};

export const getTrialRecord = async (trialId, mouseId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Trial_record" WHERE trial_id = ? AND mouse_id = ?`, trialId, mouseId);
};

export const createTrialRecord = async (trialId, mouseId, timeRecord, rpmRecord) => {
  const db = await getDatabase();

  await db.run(`
    INSERT INTO "Trial_record" (trial_id, mouse_id, time_record, rpm_record)
    VALUES (?, ?, ?, ?)
  `, trialId, mouseId, timeRecord, rpmRecord);

  return { trial_id: trialId, mouse_id: mouseId }; // In this case, these two values are unique identifiers
};

export const updateTrialRecord = async (trialId, mouseId, timeRecord, rpmRecord) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Trial_record"
    SET time_record = ?, rpm_record = ?
    WHERE trial_id = ? AND mouse_id = ?
  `, timeRecord, rpmRecord, trialId, mouseId);
};

export const deleteTrialRecord = async (trialId, mouseId) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Trial_record"
    WHERE trial_id = ? AND mouse_id = ?
  `, trialId, mouseId);
};
