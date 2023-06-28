import { getDatabase } from './databaseUtils';
import { getCagesForExperiment } from './cageUtils';

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

export const createDailyExperiment = async (experiment_id, experimentator_ids, place_id, acclimatation_time, temperature, lux, humidity, cage_order) => {
  const db = await getDatabase();
  
  const result = await db.run(`
    INSERT INTO Daily_Experiment (experiment_id, place_id, acclimatation_time, temperature, lux, humidity)
    VALUES (?, ?, ?, ?, ?, ?)
  `, experiment_id, place_id, acclimatation_time, temperature, lux, humidity);
  
  const daily_experiment_id = result.lastID;

  for (let experimentator_id of experimentator_ids) {
    await db.run(`
      INSERT INTO Daily_Experimentator (daily_experiment_id, experimentator_id)
      VALUES (?, ?)
    `, daily_experiment_id, experimentator_id);
  }

  for (let i = 0; i < cage_order.length; i++) {
    await db.run(`
      INSERT INTO Daily_Cage_Order (daily_experiment_id, cage_id, order)
      VALUES (?, ?, ?)
    `, daily_experiment_id, cage_order[i], i);
  }

  return daily_experiment_id;
};

export const updateDailyExperiment = async (id, experiment_id, experimentator_ids, place_id, acclimatation_time, temperature, lux, humidity, cage_order) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Daily_Experiment
    SET experiment_id = ?, place_id = ?, acclimatation_time = ?, temperature = ?, lux = ?, humidity = ?
    WHERE id = ?
  `, experiment_id, place_id, acclimatation_time, temperature, lux, humidity, id);

  // Update experimentators
  await db.run(`
    DELETE FROM Daily_Experimentator
    WHERE daily_experiment_id = ?
  `, id);

  for (let experimentator_id of experimentator_ids) {
    await db.run(`
      INSERT INTO Daily_Experimentator (daily_experiment_id, experimentator_id)
      VALUES (?, ?)
    `, id, experimentator_id);
  }

  // Update cage orders
  await db.run(`
    DELETE FROM Daily_Cage_Order
    WHERE daily_experiment_id = ?
  `, id);

  for (let i = 0; i < cage_order.length; i++) {
    await db.run(`
      INSERT INTO Daily_Cage_Order (daily_experiment_id, cage_id, order)
      VALUES (?, ?, ?)
    `, id, cage_order[i], i);
  }
};

export const deleteDailyExperiment = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Daily_Experiment
    WHERE id = ?
  `, id);
};

// Other functions (createExperiment, updateExperiment, createTrial, etc.) are unchanged.

export const deleteExperiment = async (id) => {
  const db = await getDatabase();

    await db.run(`
      DELETE FROM Experiment
      WHERE id = ?
    `, id);
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

  const cageOrders = await db.all(`
    SELECT cage_id
    FROM Daily_Cage_Order
    WHERE daily_experiment_id = ?
    ORDER BY order
  `, dailyExperimentId);

  return {
    ...dailyExperiment,
    trials: trialsFull,
    cageOrders: cageOrders.map(item => item.cage_id),
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