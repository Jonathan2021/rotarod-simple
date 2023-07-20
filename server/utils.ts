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

        // Set foreign_keys pragma to ON
        await dbInstance.run(`PRAGMA foreign_keys = ON;`);
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

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

// Utility functions

export function shuffleArray(inputArray) {
    let array = [...inputArray]; // Create a copy of the input array
    let currentIndex = array.length, temporaryValue, randomIndex;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

// Study

export const getStudies = async () => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Study" ORDER BY "id" DESC`);
};

export const getStudy = async (studyId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Study" WHERE id = ?`, studyId);
};

export const createStudy = async (title) => {
  const db = await getDatabase();
  const result = await db.run(`INSERT INTO "Study" (title) VALUES (?)`, title);
  return result.lastID;
};

export const updateStudy = async (id, title) => {
  const db = await getDatabase();
  const result = await db.run(`UPDATE "Study" SET title = ? WHERE id = ?`, title, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No study found with id ${id}`);
  }
};

export const deleteStudy = async (id) => {
  const db = await getDatabase();
  const result = await db.run(`DELETE FROM "Study" WHERE id = ?`, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No study found with id ${id}`);
  }
};

// Experiment

export const getExperiments = async () => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Experiment"`);
};

export const getExperimentsFromStudy = async (studyId) => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Experiment" WHERE study_id = ? ORDER BY "id" DESC`, studyId);
};

export const getExperiment = async (experimentId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Experiment" WHERE id = ?`, experimentId);
};

export const createExperiment = async (studyId, title) => {
  const db = await getDatabase();
  const result = await db.run(`INSERT INTO "Experiment" (study_id, title) VALUES (?, ?)`, studyId, title);
  return result.lastID;
};

export const updateExperiment = async (id, title) => {
  const db = await getDatabase();
  const result = await db.run(`UPDATE "Experiment" SET title = ? WHERE id = ?`, title, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No experiment found with id ${id}`);
  }
};

export const deleteExperiment = async (id) => {
  const db = await getDatabase();
  const result = await db.run(`DELETE FROM "Experiment" WHERE id = ?`, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No experiment found with id ${id}`);
  }
};

export const countRunsWithTrialsExp = async (experimentId) => {
  const db = await getDatabase();
  const result = await db.get(`
    SELECT COUNT(*)
    FROM Run r
    JOIN Trial t ON r.id = t.run_id
    WHERE r.experiment_id = ?
  `, experimentId);

  return result['COUNT(*)'];
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

export const getCageCompleteFromExp = async (expId) => {
  const db = await getDatabase();
  return await db.all(`
    SELECT Cage.id, Cage.cage_nb, Cage.exp_id, Mouse.id as mouse_id, Mouse.ucb_identifier, Mouse.zigosity
    FROM Cage 
    LEFT JOIN Mouse ON Cage.id = Mouse.cage_id
    WHERE Cage.exp_id = ? 
    ORDER BY Cage.cage_nb, Mouse.ucb_identifier DESC`, expId);
};

export const getAllCagesFromExp = async (expId) => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Cage" WHERE exp_id = ?`, expId);
};

export const createCage = async (cageNb, expId) => {
  const db = await getDatabase();
  const result = await db.run(`INSERT INTO "Cage" (cage_nb, exp_id) VALUES (?, ?)`, cageNb, expId);
  return result.lastID;
};

export const updateCage = async (id, cageNb, expId) => {
  const db = await getDatabase();
  const result = await db.run(`UPDATE "Cage" SET cage_nb = ?, exp_id = ? WHERE id = ?`, cageNb, expId, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No cage found with id ${id}`);
  } 
};

export const deleteCage = async (id) => {
  const db = await getDatabase();
  const result = await db.run(`DELETE FROM "Cage" WHERE id = ?`, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No cage found with id ${id}`);
  } 
};

export const deleteAllCagesExp = async (expId) => {
  const db = await getDatabase();
  const result = await db.run(`DELETE FROM "Cage" WHERE exp_id = ?`, expId);
  return result.changes;
};

// Mouse

export const getMice = async () => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Mouse"`);
};

export const getMouse = async (mouseId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Mouse" WHERE id = ?`, mouseId);
};

export const getMiceFromCage = async (cageId) => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Mouse" WHERE cage_id = ?`, cageId);
};

export const getAllMiceFromExp = async (expId) => {
  const db = await getDatabase();
  return await db.all(`
    SELECT Mouse.*
    FROM Mouse
    INNER JOIN Cage ON Mouse.cage_id = Cage.id
    WHERE Cage.exp_id = ?
  `, expId);
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
  const result = await db.run(`
    UPDATE "Mouse"
    SET cage_id = ?, ucb_identifier = ?, zigosity = ?
    WHERE id = ?
  `, cageId, ucbIdentifier, zigosity, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No mouse found with id ${id}`);
  } 
};

export const deleteMouse = async (id) => {
  const db = await getDatabase();
  const result = await db.run(`
    DELETE FROM "Mouse"
    WHERE id = ?
  `, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No mouse found with id ${id}`);
  } 
};

// Run

export const getRuns = async () => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Run"`);
};

export const getRunsFromExperiment = async (expId) => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Run" WHERE experiment_id = ? ORDER BY "date_acclim" DESC`, expId);
};

export const getRun = async (runId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Run" WHERE id = ?`, runId);
};

export const createRun = async (experimentId, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other) => {
  const db = await getDatabase();
  const result = await db.run(`
    INSERT INTO "Run" (experiment_id, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, experimentId, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other);

  return result.lastID;
};

export const updateRun = async (id, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other) => {
  const db = await getDatabase();
  const result = await db.run(`
    UPDATE "Run"
    SET is_constant_rpm = ?, rpm = ?, experimentator = ?, date_acclim = ?, temperature = ?, humidity = ?, lux = ?, other = ?
    WHERE id = ?
  `, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other, id);
    
  if (result.changes === 0) {
    throw new NotFoundError(`No run found with id ${id}`);
  }
};

export const deleteRun = async (id) => {
  const db = await getDatabase();
  const result = await db.run(`DELETE FROM "Run" WHERE id = ?`, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No run found with id ${id}`);
  }
};

export const getTrialsAndRecords = async (run_id) => {
  const db = await getDatabase();

  const result = await db.all(`
    SELECT Trial.id AS trial_id, Trial.trial_nb, Trial.trial_time, Trial_record.time_record, Trial_record.rpm_record, Trial_record.mouse_id
    FROM Trial
    INNER JOIN Trial_record ON Trial.id = Trial_record.trial_id
    WHERE Trial.run_id = ?
  `, run_id);

  if (!result.length) {
    throw new NotFoundError(`No trials or records found for run id ${run_id}`);
  }

  // Group trial records by trial id
  const trials = result.reduce((trials, record) => {
    if (!trials[record.trial_id]) {
      trials[record.trial_id] = {
        trial_nb: record.trial_nb,
        trial_time: record.trial_time,
        records: []
      };
    }

    trials[record.trial_id].records.push({
      time_record: record.time_record,
      rpm_record: record.rpm_record,
      mouse_id: record.mouse_id,
    });

    return trials;
  }, {});

  return Object.values(trials);
};

// Run_Ordering

export const getRunOrderings = async () => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Run_Ordering"`);
};

export const getCageOrder = async (run_id) => {
  const db = await getDatabase();

  const result = await db.all(`
    SELECT Cage.cage_nb
    FROM Run_Ordering
    INNER JOIN Cage ON Run_Ordering.cage_id = Cage.id
    WHERE Run_Ordering.run_id = ?
    ORDER BY Run_Ordering.ordering
  `, run_id);

  // Extract the cage numbers from the result
  const cageOrder = result.map(item => parseInt(item.cage_nb));

  return cageOrder;
};

export const createCageOrder = async (run_id, order) => {
  console.log("In utils");
  console.log(order);
  console.log(order[0]);
  const db = await getDatabase();

  // Fetch experiment id for given run id
  const run = await db.get(`
    SELECT experiment_id 
    FROM Run 
    WHERE id = ?
  `, run_id);

  if (!run) {
    throw new NotFoundError(`No run found with id ${run_id}`);
  }

  // Start a transaction
  await db.run('BEGIN');

  try {
    for (let i = 0; i < order.length; i++) {
      const cage_nb = order[i];

      // Find the cage_id associated with the cage_nb and experiment_id
      const cage = await db.get(`
        SELECT Cage.id
        FROM Cage
        INNER JOIN Experiment ON Cage.exp_id = Experiment.id
        WHERE Cage.cage_nb = ? AND Experiment.id = ?
      `, cage_nb, run.experiment_id);

      if (!cage) {
        throw new NotFoundError(`No cage found with cage_nb ${cage_nb} for experiment id ${run.experiment_id}`);
      }

      // Create a new Run_Ordering record
      await db.run(`
        INSERT INTO Run_Ordering ("cage_id", "run_id", "ordering")
        VALUES (?, ?, ?)
      `, cage.id, run_id, i + 1);
    }

    // Commit the transaction
    await db.run('COMMIT');
  } catch (error) {
    // If an error occurred, rollback the transaction
    await db.run('ROLLBACK');
    throw error;
  }
};

export const getRunOrdering = async (cageId, runId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Run_Ordering" WHERE cage_id = ? AND run_id = ?`, cageId, runId);
};

export const createRunOrdering = async (cageId, runId, order) => {
  const db = await getDatabase();
  await db.run(`INSERT INTO "Run_Ordering" ("cage_id", "run_id", "ordering") VALUES (?, ?, ?)`, cageId, runId, order);
};

export const deleteRunOrdering = async (cageId, runId) => {
  const db = await getDatabase();
  await db.run(`DELETE FROM "Run_Ordering" WHERE cage_id = ? AND run_id = ?`, cageId, runId);
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
  const result = await db.run(`INSERT INTO "Trial" (run_id, trial_nb) VALUES (?, ?)`, runId, trialNb);
  return result.lastID;
};

export const updateTrial = async (id, runId, trialNb) => {
  const db = await getDatabase();
  const result = await db.run(`UPDATE "Trial" SET run_id = ?, trial_nb = ? WHERE id = ?`, runId, trialNb, id);
  
  if (result.changes === 0) {
    throw new NotFoundError(`No trial found with id ${id}`);
  }
};

export const deleteTrial = async (id) => {
  const db = await getDatabase();
  const result = await db.run(`DELETE FROM "Trial" WHERE id = ?`, id);

  if (result.changes === 0) {
    throw new NotFoundError(`No trial found with id ${id}`);
  }
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
  await db.run(`INSERT INTO "Trial_record" (trial_id, mouse_id, time_record, rpm_record) VALUES (?, ?, ?, ?)`, trialId, mouseId, timeRecord, rpmRecord);
};

export const updateTrialRecord = async (trialId, mouseId, timeRecord, rpmRecord) => {
  const db = await getDatabase();
  await db.run(`UPDATE "Trial_record" SET time_record = ?, rpm_record = ? WHERE trial_id = ? AND mouse_id = ?`, timeRecord, rpmRecord, trialId, mouseId);
};

export const deleteTrialRecord = async (trialId, mouseId) => {
  const db = await getDatabase();
  await db.run(`DELETE FROM "Trial_record" WHERE trial_id = ? AND mouse_id = ?`, trialId, mouseId);
};
