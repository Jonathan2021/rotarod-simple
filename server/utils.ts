import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbPath: string;

if (process.env.NODE_ENV === 'development') {
  dbPath = path.join(__dirname, 'databaseDEV.db');
} else if (process.env.NODE_ENV === 'production') {
  dbPath = path.join(__dirname, 'databasePROD.db');
  //dbPath = '\\\\ncdata-prd-storage.dir.ucb-group.com\\ncd_data$\\Noldus_Ethovision\\Rotarod\\database.db';
} else {
  throw new Error('NODE_ENV set to ' + process.env.NODE_ENV + ', but should be either development or production');
}

export { dbPath };

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

export const closeDatabase = async () => {
  if (dbInstance !== null) {
    await dbInstance.close();
    console.log('Database connection closed.');
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

export const createStudy = async (title, ethProj, tickat) => {
  const db = await getDatabase();
  const result = await db.run(`INSERT INTO "Study" (title, eth_proj, tickat) VALUES (?, ?, ?)`, title, ethProj, tickat);
  return result.lastID;
};

export const updateStudy = async (id, title, ethProj, tickat) => {
  const db = await getDatabase();
  const result = await db.run(`UPDATE "Study" SET title = ?, eth_proj = ?, tickat = ? WHERE id = ?`, title, ethProj, tickat, id);

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
  return await db.all(`SELECT * FROM "Experiment" WHERE study_id = ? ORDER BY "creation_dt" DESC`, studyId);
};

export const getExperiment = async (experimentId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Experiment" WHERE id = ?`, experimentId);
};

export const createExperiment = async (studyId, title) => {
  const db = await getDatabase();
  const result = await db.run(`INSERT INTO "Experiment" (study_id, title, creation_dt) VALUES (?, ?, datetime('now'))`, studyId, title);
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
    SELECT Cage.id, Cage.cage_nb, Cage.exp_id, Mouse.id as mouse_id, Mouse.ucb_identifier, Mouse.zigosity, Mouse.treatment
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
      
export const getMiceOrderedExcel = async (expId) => {
  const db = await getDatabase();
  return await db.all(`
  SELECT Mouse.* FROM Mouse
  JOIN Cage ON Mouse.cage_id = Cage.id
  WHERE Cage.exp_id = ?
  ORDER BY Mouse.zigosity ASC, Mouse.treatment ASC, Mouse.id ASC;`, expId);
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


export const createMouse = async (cageId, ucbIdentifier, zigosity, treatment) => {
  const db = await getDatabase();
  const result = await db.run(`
    INSERT INTO "Mouse" (cage_id, ucb_identifier, zigosity, treatment)
    VALUES (?, ?, ?, ?)
  `, cageId, ucbIdentifier, zigosity, treatment);

  return result.lastID;
};

export const updateMouse = async (id, cageId, ucbIdentifier, zigosity, treatment) => {
  const db = await getDatabase();
  const result = await db.run(`
    UPDATE "Mouse"
    SET cage_id = ?, ucb_identifier = ?, zigosity = ?, treatment = ?
    WHERE id = ?
  `, cageId, ucbIdentifier, zigosity, treatment, id);

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
  return await db.all(`SELECT * FROM "Run" WHERE experiment_id = ? ORDER BY "date_acclim" ASC`, expId);
};

export const getRun = async (runId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Run" WHERE id = ?`, runId);
};

export const createRun = async (experimentId, place, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other) => {
  const db = await getDatabase();
  const result = await db.run(`
    INSERT INTO "Run" (experiment_id, place, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, experimentId, place, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other);

  return result.lastID;
};

export const updateRun = async (id, place, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other) => {
  const db = await getDatabase();
  const result = await db.run(`
    UPDATE "Run"
    SET place = ?, is_constant_rpm = ?, rpm = ?, experimentator = ?, date_acclim = ?, temperature = ?, humidity = ?, lux = ?, other = ?
    WHERE id = ?
  `, place, is_constant_rpm, rpm, experimentator, date_acclim, temperature, humidity, lux, other, id);
    
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
    SELECT Trial.id AS trial_id, Trial.trial_nb, Trial.trial_time, Trial_record.time_record, Trial_record.rpm_record, Trial_record.event, Trial_record.mouse_id
    FROM Trial
    LEFT JOIN Trial_record ON Trial.id = Trial_record.trial_id
    WHERE Trial.run_id = ?
  `, run_id);

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
      event: record.event,
      mouse_id: record.mouse_id,
    });

    return trials;
  }, {});

  return trials;
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

export const getOrderingFromRun = async (runId) => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Run_Ordering" WHERE run_id = ? ORDER BY ordering ASC`, runId);
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

export const getTrialsFromRun = async (runId) => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Trial" WHERE run_id = ?`, runId);
};

export const getTrialsFromRunForMouse = async (runId, mouseId) => {
  const db = await getDatabase();
  const rows = await db.all(`SELECT tr.trial_id, tr.time_record, tr.rpm_record, tr.event
        FROM Trial_record AS tr
        JOIN Trial AS t ON tr.trial_id = t.id
        JOIN Run AS r ON t.run_id = r.id
        WHERE tr.mouse_id = ? AND r.id = ?;`, mouseId, runId);

  const result = {};
  rows.forEach(row => {
    result[row.trial_id] = {
      time_record: row.time_record,
      rpm_record: row.rpm_record,
      event: row.event
    };
  });

  return result;
};

export const getTrial = async (trialId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Trial" WHERE id = ?`, trialId);
};

export const createTrial = async (runId, trialNb, trialTime) => {
  const db = await getDatabase();
  const result = await db.run(`INSERT INTO "Trial" (run_id, trial_nb, trial_time) VALUES (?, ?, ?)`, runId, trialNb, trialTime);
  return result.lastID;
};

export const updateTrial = async (id, trialNb, trialTime) => {
  const db = await getDatabase();
  const result = await db.run(`UPDATE "Trial" SET trial_nb = ?, trial_time = ? WHERE id = ?`, trialNb, trialTime, id);
  
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

export const deleteAllTrials = async () => {
  const db = await getDatabase();
  await db.run(`DELETE FROM "Trial"`);
};

// Trial_record

export const getTrialRecords = async () => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Trial_record"`);
};

export const getRecordsFromTrial = async (trialId) => {
  const db = await getDatabase();
  return await db.all(`SELECT * FROM "Trial_record WHERE trial_id = ?"`, trialId);
};

export const getTrialRecord = async (trialId, mouseId) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Trial_record" WHERE trial_id = ? AND mouse_id = ?`, trialId, mouseId);
};

export const createTrialRecord = async (trialId, mouseId, timeRecord, rpmRecord, event) => {
  const db = await getDatabase();
  await db.run(`INSERT INTO "Trial_record" (trial_id, mouse_id, time_record, rpm_record, event) VALUES (?, ?, ?, ?, ?)`, trialId, mouseId, timeRecord, rpmRecord, event);
};

export const updateTrialRecord = async (trialId, mouseId, timeRecord, rpmRecord, event) => {
  const db = await getDatabase();
  await db.run(`UPDATE "Trial_record" SET time_record = ?, rpm_record = ?, event = ? WHERE trial_id = ? AND mouse_id = ?`, timeRecord, rpmRecord, event, trialId, mouseId);
};

export const deleteTrialRecord = async (trialId, mouseId) => {
  const db = await getDatabase();
  await db.run(`DELETE FROM "Trial_record" WHERE trial_id = ? AND mouse_id = ?`, trialId, mouseId);
};

export const deleteAllTrialRecords = async () => {
  const db = await getDatabase();
  await db.run(`DELETE FROM "Trial_record"`);
};
