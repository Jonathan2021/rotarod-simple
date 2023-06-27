// server/utils/cageUtil.ts
import { getDatabase } from './databaseUtils';

export const getCagesForExperiment = async (experimentId) => {
  const db = await getDatabase();

  const cages = await db.all(`
    SELECT Cage.id, Cage.cage_nb, GROUP_CONCAT(Mouse_Cage.mouse_id) as mice
    FROM Cage
    LEFT JOIN Mouse_Cage ON Cage.id = Mouse_Cage.cage_id
    WHERE Cage.experiment_id = ?
    GROUP BY Cage.id
  `, experimentId);

  // Convert the comma-separated mice string to an array
  cages.forEach(cage => {
    cage.mice = cage.mice ? cage.mice.split(',').map(Number) : [];
  });

  return cages;
};

export const addMiceToCage = async (cageId, mouseIds) => {
  const db = await getDatabase();
  
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
      INSERT INTO Cage (cage_nb, experiment_id)
      VALUES (?, ?)
    `, cageNb, experimentId);

    // Add the mice to the new cage
    await addMiceToCage(cageResult.lastID, mouseIds);

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
    // Update the cage number
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
    await addMiceToCage(cageId, mouseIds);

    // Commit the transaction if everything went well
    await db.run('COMMIT');
  } catch (err) {
    // If something went wrong, rollback the transaction
    await db.run('ROLLBACK');
    throw err;
  }
};

export const deleteCage = async (cageId) => {
  const db = await getDatabase();

  // Begin a database transaction
  await db.run('BEGIN TRANSACTION');

  try {
    // Delete the cage and its associations with mice
    await db.run(`
      DELETE FROM Mouse_Cage
      WHERE cage_id = ?
    `, cageId);

  await db.run(`
    DELETE FROM Cage
    WHERE id = ?
  `, cageId);

  // Commit the transaction if everything went well
  await db.run('COMMIT');
  } catch (err) {
    // If something went wrong, rollback the transaction
    await db.run('ROLLBACK');
    throw err;
  }
};