// server/utils/experimentUtils.ts
import { getDatabase } from './databaseUtils';
import { getCagesForExperiment, deleteCageNoTransaction } from './cageUtils';

export const createExperimentator = async (firstname, surname) => {
  const db = await getDatabase();
  
  const result = await db.run(`
    INSERT INTO Experimentator (firstname, surname)
    VALUES (?, ?)
  `, firstname, surname);
  
  return result.lastID;
};

export const updateExperimentator = async (id, firstname, surname) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Experimentator
    SET firstname = ?, surname = ?
    WHERE id = ?
  `, firstname, surname, id);
};

export const deleteExperimentator = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Experimentator
    WHERE id = ?
  `, id);
};

export const createDailyExperiment = async (experiment_id, experimentator_id, place_id, acclimatation_time, temperature, lux, humidity) => {
  const db = await getDatabase();
  
  const result = await db.run(`
    INSERT INTO Daily_Experiment (experiment_id, experimentator_id, place_id, acclimatation_time, temperature, lux, humidity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, experiment_id, experimentator_id, place_id, acclimatation_time, temperature, lux, humidity);
  
  return result.lastID;
};

export const updateDailyExperiment = async (id, experiment_id, experimentator_id, place_id, acclimatation_time, temperature, lux, humidity) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Daily_Experiment
    SET experiment_id = ?, experimentator_id = ?, place_id = ?, acclimatation_time = ?, temperature = ?, lux = ?, humidity = ?
    WHERE id = ?
  `, experiment_id, experimentator_id, place_id, acclimatation_time, temperature, lux, humidity, id);
};

export const deleteDailyExperiment = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Daily_Experiment
    WHERE id = ?
  `, id);
};

export const createExperiment = async (project_id, title, objective, animals_description, additional_info, creation_date) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Experiment (project_id, title, objective, animals_description, additional_info, creation_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `, project_id, title, objective, animals_description, additional_info, creation_date);
  
  return result.lastID;
};

export const updateExperiment = async (id, project_id, title, objective, animals_description, additional_info, creation_date) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Experiment
    SET project_id = ?, title = ?, objective = ?, animals_description = ?, additional_info = ?, creation_date = ?
    WHERE id = ?
  `, project_id, title, objective, animals_description, additional_info, creation_date, id);
};

export const deleteExperiment = async (id) => {
  const db = await getDatabase();

  // Begin a database transaction
  await db.run('BEGIN TRANSACTION');

  try {
    // Delete the experiment and its associations with daily experiments
    await db.run(`
      DELETE FROM Daily_Experiment
      WHERE experiment_id = ?
    `, id);

    // Remove associated cages
    const cages = await getCagesForExperiment(id);
    for (let cage of cages) {
      await deleteCageNoTransaction(cage.id);
    }

    await db.run(`
      DELETE FROM Experiment
      WHERE id = ?
    `, id);

    // Commit the transaction if everything went well
    await db.run('COMMIT');
  } catch (err) {
    // If something went wrong, rollback the transaction
    await db.run('ROLLBACK');
    throw err;
  }
};

export const createTrial = async (daily_experiment_id, time) => {
  const db = await getDatabase();
  
  const result = await db.run(`
    INSERT INTO Trial (daily_experiment_id, time)
    VALUES (?, ?)
  `, daily_experiment_id, time);
  
  return result.lastID;
};

export const updateTrial = async (id, daily_experiment_id, time) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Trial
    SET daily_experiment_id = ?, time = ?
    WHERE id = ?
  `, daily_experiment_id, time, id);
};

export const deleteTrial = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Trial
    WHERE id = ?
  `, id);
};

export const createTrialLine = async (mouse_id, trial_id, duration_sec, mouse_order) => {
  const db = await getDatabase();
  
  const result = await db.run(`
    INSERT INTO Trial_line (mouse_id, trial_id, duration_sec, mouse_order)
    VALUES (?, ?, ?, ?)
  `, mouse_id, trial_id, duration_sec, mouse_order);
  
  return result.lastID;
};

export const updateTrialLine = async (mouse_id, trial_id, duration_sec, mouse_order) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Trial_line
    SET duration_sec = ?, mouse_order = ?
    WHERE mouse_id = ? AND trial_id = ?
  `, duration_sec, mouse_order, mouse_id, trial_id);
};

export const deleteTrialLine = async (mouse_id, trial_id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Trial_line
    WHERE mouse_id = ? AND trial_id = ?
  `, mouse_id, trial_id);
};

export const getTrialFull = async (trialId) => {
  const db = await getDatabase();

  const trial = await db.get(`
    SELECT *
    FROM Trial
    WHERE id = ?
  `, trialId);

  const trialLines = await db.all(`
    SELECT *
    FROM Trial_line
    WHERE trial_id = ?
  `, trialId);

  return {
    ...trial,
    trialLines: trialLines,
  };
};

export const getDailyExperimentFull = async (dailyExperimentId) => {
  const db = await getDatabase();

  const dailyExperiment = await db.get(`
    SELECT *
    FROM Daily_Experiment
    WHERE id = ?
  `, dailyExperimentId);

  const trials = await db.all(`
    SELECT id
    FROM Trial
    WHERE daily_experiment_id = ?
  `, dailyExperimentId);

  const trialsFull = [];
  for (let trial of trials) {
    const trialFull = await getTrialFull(trial.id);
    trialsFull.push(trialFull);
  }

  return {
    ...dailyExperiment,
    trials: trialsFull,
  };
};

export const getExperimentFull = async (experimentId) => {
  const db = await getDatabase();

  const experiment = await db.get(`
    SELECT *
    FROM Experiment
    WHERE id = ?
  `, experimentId);

  const dailyExperiments = await db.all(`
    SELECT id
    FROM Daily_Experiment
    WHERE experiment_id = ?
  `, experimentId);

  const dailyExperimentsFull = [];
  for (let dailyExperiment of dailyExperiments) {
    const dailyExperimentFull = await getDailyExperimentFull(dailyExperiment.id);
    dailyExperimentsFull.push(dailyExperimentFull);
  }

  const cages = await getCagesForExperiment(experimentId)

  return {
    ...experiment,
    cages: cages,
    dailyExperiments: dailyExperimentsFull
  };
};