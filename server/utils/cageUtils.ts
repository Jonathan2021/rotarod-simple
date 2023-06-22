// server/utils/cageUtil.ts
import { getDatabase } from './databaseUtils';

export const getCagesForExperiment = async (experimentId) => {
  const db = await getDatabase();

  const cages = await db.all(`
    SELECT Cage.id, Cage.cage_nb, GROUP_CONCAT(Mouse_Cage.mouse_id) as mice
    FROM Cage
    INNER JOIN Cage_Experiment ON Cage.id = Cage_Experiment.cage_id
    LEFT JOIN Mouse_Cage ON Cage.id = Mouse_Cage.cage_id
    WHERE Cage_Experiment.experiment_id = ?
    GROUP BY Cage.id
  `, experimentId);

  // Convert the comma-separated mice string to an array
  cages.forEach(cage => {
    cage.mice = cage.mice ? cage.mice.split(',').map(Number) : [];
  });

  return cages;
};

export const addMiceToCage = async (cageId, mouseIds, db) => {
  // Link the mice to the new cage
  for (let mouseId of mouseIds) {
    await db.run(`
      INSERT INTO Mouse_Cage (mouse_id, cage_id)
      VALUES (?, ?)
    `, mouseId, cageId);
  }
};

export const addCageToExperiment = async (cageNb, experimentId, mouseIds) => {
  const db = await getDatabase();

  // Begin a database transaction
  await db.run('BEGIN TRANSACTION');

  try {
    // Insert the new cage and link it to the experiment
    const cageResult = await db.run(`
      INSERT INTO Cage (cage_nb)
      VALUES (?)
    `, cageNb);

    await db.run(`
      INSERT INTO Cage_Experiment (cage_id, experiment_id)
      VALUES (?, ?)
    `, cageResult.lastID, experimentId);

    // Add the mice to the new cage
    await addMiceToCage(cageResult.lastID, mouseIds, db);

    // Commit the transaction if everything went well
    await db.run('COMMIT');
    return cageResult.lastID; 
  } catch (err) {
    // If something went wrong, rollback the transaction
    await db.run('ROLLBACK');
    throw err;
  }
};

export const updateCage = async (cageId, cageNb, mouseIds) => {
  const db = await getDatabase();

  // Begin a database transaction
  await db.run('BEGIN TRANSACTION');

  try {
    // Update the cage number and its experiment association
    await db.run(`
      UPDATE Cage
      SET cage_nb = ?
      WHERE id = ?
    `, cageNb, cageId);

    // Update the mice associated with the cage
    await db.run(`
      DELETE FROM Mouse_Cage
      WHERE cage_id = ?
    `, cageId);

    // Add the new set of mice to the cage
    await addMiceToCage(cageId, mouseIds, db);

    // Commit the transaction if everything went well
    await db.run('COMMIT');
  } catch (err) {
    // If something went wrong, rollback the transaction
    await db.run('ROLLBACK');
    throw err;
  }
};

export const deleteCageNoTransaction = async (cageId) => {
  const db = await getDatabase();
  
  // Delete the cage and its associations with mice and experiments
  await db.run(`
    DELETE FROM Mouse_Cage
    WHERE cage_id = ?
  `, cageId);

  await db.run(`
    DELETE FROM Cage_Experiment
    WHERE cage_id = ?
  `, cageId);

  await db.run(`
    DELETE FROM Cage
    WHERE id = ?
  `, cageId);
};

export const deleteCage = async (cageId) => {
  const db = await getDatabase();

  // Begin a database transaction
  await db.run('BEGIN TRANSACTION');

  try {
    await deleteCageNoTransaction(cageId);

    // Commit the transaction if everything went well
    await db.run('COMMIT');
  } catch (err) {
    // If something went wrong, rollback the transaction
    await db.run('ROLLBACK');
    throw err;
  }
};