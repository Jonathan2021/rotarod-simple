// server/utils/experimentUtils.ts
import { getDatabase } from './databaseUtils';

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

export const createDailyExperiment = async (experiment_id, experimentator_id, date, acclimatation_time, temperature, lux, humidity) => {
  const db = await getDatabase();
  
  const result = await db.run(`
    INSERT INTO Daily_Experiment (experiment_id, experimentator_id, date, acclimatation_time, temperature, lux, humidity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, experiment_id, experimentator_id, date, acclimatation_time, temperature, lux, humidity);
  
  return result.lastID;
};

export const updateDailyExperiment = async (id, experiment_id, experimentator_id, date, acclimatation_time, temperature, lux, humidity) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Daily_Experiment
    SET experiment_id = ?, experimentator_id = ?, date = ?, acclimatation_time = ?, temperature = ?, lux = ?, humidity = ?
    WHERE id = ?
  `, experiment_id, experimentator_id, date, acclimatation_time, temperature, lux, humidity, id);
};

export const deleteDailyExperiment = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Daily_Experiment
    WHERE id = ?
  `, id);
};

export const createExperiment = async (title, description, creation_date) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Experiment (title, description, creation_date)
    VALUES (?, ?, ?)
  `, title, description, creation_date);
  
  return result.lastID;
};

export const updateExperiment = async (id, title, description, creation_date) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Experiment
    SET title = ?, description = ?, creation_date = ?
    WHERE id = ?
  `, title, description, creation_date, id);
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

export const getTrialFull = async (trialId) => {
  const db = await getDatabase();

  const trial = await db.get(`
    SELECT Trial.*, Trial_line.*
    FROM Trial
    INNER JOIN Trial_line ON Trial.id = Trial_line.trial_id
    WHERE Trial.id = ?
  `, trialId);

  return trial;
};

export const getDailyExperimentFull = async (dailyExperimentId) => {
  const db = await getDatabase();

  const dailyExperimentAndTrial = await db.all(`
    SELECT Daily_Experiment.*, Trial.id as trial_id
    FROM Daily_Experiment
    INNER JOIN Trial ON Daily_Experiment.id = Trial.daily_experiment_id
    WHERE Daily_Experiment.id = ?
  `, dailyExperimentId);

  const trials = dailyExperimentAndTrial.map(({ trial_id }) => getTrialFull(trial_id));

  return {
    ...dailyExperimentAndTrial[0],
    trials: await Promise.all(trials),
  };
};

export const getExperimentFull = async (experimentId) => {
  const db = await getDatabase();

  const experimentAndDailyExperiments = await db.all(`
    SELECT Experiment.*, Daily_Experiment.id as daily_experiment_id, Experimentator.firstname, Experimentator.surname
    FROM Experiment
    INNER JOIN Daily_Experiment ON Experiment.id = Daily_Experiment.experiment_id
    INNER JOIN Experimentator ON Daily_Experiment.experimentator_id = Experimentator.id
    WHERE Experiment.id = ?
  `, experimentId);

  const dailyExperiments = experimentAndDailyExperiments.map(({ daily_experiment_id }) => getDailyExperimentFull(daily_experiment_id));

  return {
    ...experimentAndDailyExperiments[0],
    dailyExperiments: await Promise.all(dailyExperiments),
  };
};