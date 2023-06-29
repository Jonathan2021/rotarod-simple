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

// Group

export const getGroups = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Group"`);
};

export const getGroup = async (groupId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Group" WHERE id = ?`, groupId);
};

export const createGroup = async (title, description) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Group" (title, description)
    VALUES (?, ?)
  `, title, description);

  return result.lastID;
};

export const updateGroup = async (id, title, description) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Group"
    SET title = ?, description = ?
    WHERE id = ?
  `, title, description, id);
};

export const deleteGroup = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Group"
    WHERE id = ?
  `, id);
};

// Ethical Project
export const getEthicalProjects = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Ethical_Project"`);
};

export const getEthicalProject = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Ethical_Project" WHERE id = ?`, id);
};

export const findEthicalProject = async (title) => {
  const db = await getDatabase();
  return await db.get('SELECT * FROM "Ethical_Project" WHERE title = ?', title);
}

export const createEthicalProject = async (title) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Ethical_Project" (title)
    VALUES (?)
  `, title);

  return result.lastID;
};

export const updateEthicalProject = async (id, title) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Ethical_Project"
    SET title = ?
    WHERE id = ?
  `, title, id);
};

export const deleteEthicalProject = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Ethical_Project"
    WHERE id = ?
  `, id);
};


// Ethical Experiment

export const getEthicalExperiments = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Ethical_Experiment"`);
};

export const getEthicalExperiment = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Ethical_Experiment" WHERE id = ?`, id);
};

export const findEthicalExperiment = async (title) => {
  const db = await getDatabase();
  return await db.get('SELECT * FROM "Ethical_Experiment" WHERE title = ?', title);
}

export const getEthicalExperimentsFromProject = async(eth_project_id) => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Ethical_Experiment" WHERE eth_project_id = ?`, eth_project_id);
}

export const createEthicalExperiment = async (eth_project_id, title) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Ethical_Experiment" (eth_project_id, title)
    VALUES (?, ?)
  `, eth_project_id, title);

  return result.lastID;
};

export const updateEthicalExperiment = async (id, eth_project_id, title) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Ethical_Experiment"
    SET eth_project_id = ?, title = ?
    WHERE id = ?
  `, eth_project_id, title, id);
};

export const deleteEthicalExperiment = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Ethical_Experiment"
    WHERE id = ?
  `, id);
};

// Study
export const getStudies = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Study"`);
};

export const getStudy = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Study" WHERE id = ?`, id);
};

export const findStudyByTitle = async (title) => {
  const db = await getDatabase();
  return await db.get(`SELECT * FROM "Study" WHERE title = ?`, title);
};

export const createStudy = async (title, ethProjectId=null, ethExpId=null, objective=null) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Study" (eth_project_id, eth_exp_id, title, objective)
    VALUES (?, ?, ?, ?)
  `, ethProjectId, ethExpId, title, objective);

  return result.lastID;
};

export const updateStudy = async (id, ethProjectId, ethExpId, title, objective) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Study"
    SET eth_project_id = ?, eth_exp_id = ?, title = ?, objective = ?
    WHERE id = ?
  `, ethProjectId, ethExpId, title, objective, id);
};

export const deleteStudy = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Study"
    WHERE id = ?
  `, id);
};

// Batch tickatlab

export const getBatchTickatlabs = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Batch_tickatlab"`);
};

export const getBatchTickatlab = async (studyId, batchNb) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Batch_tickatlab" WHERE study_id = ? AND batch_nb = ?`, studyId, batchNb);
};

export const createBatchTickatlab = async (studyId, batchNb, description) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Batch_tickatlab" (study_id, batch_nb, description)
    VALUES (?, ?, ?)
  `, studyId, batchNb, description);

  return result.lastID;
};

export const updateBatchTickatlab = async (studyId, batchNb, description) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Batch_tickatlab"
    SET description = ?
    WHERE study_id = ? AND batch_nb = ?
  `, description, studyId, batchNb);
};

export const deleteBatchTickatlab = async (studyId, batchNb) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Batch_tickatlab"
    WHERE study_id = ? AND batch_nb = ?
  `, studyId, batchNb);
};

// Mouse
export const getMice = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Mouse"`);
};

export const getMouse = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Mouse" WHERE id = ?`, id);
};

export const createMouse = async (mouseNb, studyId) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Mouse" (mouse_nb, study_id)
    VALUES (?, ?)
  `, mouseNb, studyId);

  return result.lastID;
};

export const updateMouse = async (id, mouseNb, studyId) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Mouse"
    SET mouse_nb = ?, study_id = ?
    WHERE id = ?
  `, mouseNb, studyId, id);
};

export const deleteMouse = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Mouse"
    WHERE id = ?
  `, id);
};

// Pace
export const getPlaces = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Place"`);
};

export const getPlace = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Place" WHERE id = ?`, id);
};

export const createPlace = async (title) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Place" (title)
    VALUES (?)
  `, title);

  return result.lastID;
};

export const updatePlace = async (id, title) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Place"
    SET title = ?
    WHERE id = ?
  `, title, id);
};

export const deletePlace = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Place"
    WHERE id = ?
  `, id);
};

// Experiment
export const getExperiments = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Experiment"`);
};

export const getExperiment = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Experiment" WHERE id = ?`, id);
};

export const createExperiment = async (studyId, title, testInfo, creationDate) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Experiment" (study_id, title, test_info, creation_date)
    VALUES (?, ?, ?, ?)
  `, studyId, title, testInfo, creationDate);

  return result.lastID;
};

export const updateExperiment = async (id, studyId, title, testInfo, creationDate) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Experiment"
    SET study_id = ?, title = ?, test_info = ?, creation_date = ?
    WHERE id = ?
  `, studyId, title, testInfo, creationDate, id);
};

export const deleteExperiment = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Experiment"
    WHERE id = ?
  `, id);
};

// Cage
export const getCages = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Cage"`);
};

export const getCage = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Cage" WHERE id = ?`, id);
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

// Cage_Group
export const getCageGroups = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Cage_Group"`);
};

export const getCageGroup = async (cageId, groupId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Cage_Group" WHERE cage_id = ? AND group_id = ?`, cageId, groupId);
};

export const createCageGroup = async (cageId, groupId) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Cage_Group" (cage_id, group_id)
    VALUES (?, ?)
  `, cageId, groupId);

  return result;
};

export const deleteCageGroup = async (cageId, groupId) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Cage_Group"
    WHERE cage_id = ? AND group_id = ?
  `, cageId, groupId);
};

// Mouse_Cage
export const getMouseCages = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Mouse_Cage"`);
};

export const getMouseCage = async (mouseId, cageId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Mouse_Cage" WHERE mouse_id = ? AND cage_id = ?`, mouseId, cageId);
};

export const createMouseCage = async (mouseId, cageId) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Mouse_Cage" (mouse_id, cage_id)
    VALUES (?, ?)
  `, mouseId, cageId);

  return result;
};

export const deleteMouseCage = async (mouseId, cageId) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Mouse_Cage"
    WHERE mouse_id = ? AND cage_id = ?
  `, mouseId, cageId);
};

// Cage_Experiment
export const getCageExperiments = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Cage_Experiment"`);
};

export const getCageExperiment = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Cage_Experiment" WHERE id = ?`, id);
};

export const createCageExperiment = async (cageId, experimentId) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Cage_Experiment" (cage_id, experiment_id)
    VALUES (?, ?)
  `, cageId, experimentId);

  return result.lastID;
};

export const updateCageExperiment = async (id, cageId, experimentId) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Cage_Experiment"
    SET cage_id = ?, experiment_id = ?
    WHERE id = ?
  `, cageId, experimentId, id);
};

export const deleteCageExperiment = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Cage_Experiment"
    WHERE id = ?
  `, id);
};

// Experimentator
export const getExperimentators = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Experimentator"`);
};

export const getExperimentator = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Experimentator" WHERE id = ?`, id);
};

export const createExperimentator = async (firstname, surname) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Experimentator" (firstname, surname)
    VALUES (?, ?)
  `, firstname, surname);

  return result.lastID;
};

export const updateExperimentator = async (id, firstname, surname) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Experimentator"
    SET firstname = ?, surname = ?
    WHERE id = ?
  `, firstname, surname, id);
};

export const deleteExperimentator = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Experimentator"
    WHERE id = ?
  `, id);
};

// Daily Experiment
export const getDailyExperiments = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Daily_Experiment"`);
};

export const getDailyExperiment = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Daily_Experiment" WHERE id = ?`, id);
};

export const createDailyExperiment = async (experimentId, placeId, datetime, temperature, lux, humidity, additionalInfo) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Daily_Experiment" (experiment_id, place_id, datetime, temperature, lux, humidity, additional_info)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, experimentId, placeId, datetime, temperature, lux, humidity, additionalInfo);

  return result.lastID;
};

export const updateDailyExperiment = async (id, experimentId, placeId, datetime, temperature, lux, humidity, additionalInfo) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Daily_Experiment"
    SET experiment_id = ?, place_id = ?, datetime = ?, temperature = ?, lux = ?, humidity = ?, additional_info = ?
    WHERE id = ?
  `, experimentId, placeId, datetime, temperature, lux, humidity, additionalInfo, id);
};

export const deleteDailyExperiment = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Daily_Experiment"
    WHERE id = ?
  `, id);
};

// Daily_Cage_Order
export const getDailyCageOrders = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Daily_Cage_Order"`);
};

export const getDailyCageOrder = async (dailyExperimentId, cageExperimentId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Daily_Cage_Order" WHERE daily_experiment_id = ? AND cage_experiment_id = ?`, dailyExperimentId, cageExperimentId);
};

export const createDailyCageOrder = async (dailyExperimentId, cageExperimentId, order) => {
  const db = await getDatabase();

  await db.run(`
    INSERT INTO "Daily_Cage_Order" (daily_experiment_id, cage_experiment_id, order)
    VALUES (?, ?, ?)
  `, dailyExperimentId, cageExperimentId, order);
};

export const updateDailyCageOrder = async (dailyExperimentId, cageExperimentId, order) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Daily_Cage_Order"
    SET order = ?
    WHERE daily_experiment_id = ? AND cage_experiment_id = ?
  `, order, dailyExperimentId, cageExperimentId);
};

export const deleteDailyCageOrder = async (dailyExperimentId, cageExperimentId) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Daily_Cage_Order"
    WHERE daily_experiment_id = ? AND cage_experiment_id = ?
  `, dailyExperimentId, cageExperimentId);
};

// Daily_Experimentator
export const getDailyExperimentators = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Daily_Experimentator"`);
};

export const getDailyExperimentator = async (dailyExperimentId, experimentatorId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Daily_Experimentator" WHERE daily_experiment_id = ? AND experimentator_id = ?`, dailyExperimentId, experimentatorId);
};

export const createDailyExperimentator = async (dailyExperimentId, experimentatorId) => {
  const db = await getDatabase();

  await db.run(`
    INSERT INTO "Daily_Experimentator" (daily_experiment_id, experimentator_id)
    VALUES (?, ?)
  `, dailyExperimentId, experimentatorId);
};

export const deleteDailyExperimentator = async (dailyExperimentId, experimentatorId) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Daily_Experimentator"
    WHERE daily_experiment_id = ? AND experimentator_id = ?
  `, dailyExperimentId, experimentatorId);
};

// Trial
export const getTrials = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Trial"`);
};

export const getTrial = async (id) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Trial" WHERE id = ?`, id);
};

export const createTrial = async (dailyExperimentId, time) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO "Trial" (daily_experiment_id, time)
    VALUES (?, ?)
  `, dailyExperimentId, time);

  return result.lastID;
};

export const updateTrial = async (id, dailyExperimentId, time) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Trial"
    SET daily_experiment_id = ?, time = ?
    WHERE id = ?
  `, dailyExperimentId, time, id);
};

export const deleteTrial = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Trial"
    WHERE id = ?
  `, id);
};

// Trial_line
export const getTrialLines = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM "Trial_line"`);
};

export const getTrialLine = async (mouseId, trialId) => {
  const db = await getDatabase();

  return await db.get(`SELECT * FROM "Trial_line" WHERE mouse_id = ? AND trial_id = ?`, mouseId, trialId);
};

export const createTrialLine = async (mouseId, trialId, durationSec) => {
  const db = await getDatabase();

  await db.run(`
    INSERT INTO "Trial_line" (mouse_id, trial_id, duration_sec)
    VALUES (?, ?, ?)
  `, mouseId, trialId, durationSec);
};

export const updateTrialLine = async (mouseId, trialId, durationSec) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE "Trial_line"
    SET duration_sec = ?
    WHERE mouse_id = ? AND trial_id = ?
  `, durationSec, mouseId, trialId);
};

export const deleteTrialLine = async (mouseId, trialId) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM "Trial_line"
     WHERE mouse_id = ? AND trial_id = ?
  `, mouseId, trialId);
};