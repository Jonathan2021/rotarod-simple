import { getDatabase } from './databaseUtils';

export const getStudies = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM Study`);
};

export const createStudy = async (title, description) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Study (title, description)
    VALUES (?, ?)
  `, title, description);

  return result.lastID;
};

export const updateStudy = async (id, title, description) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Study
    SET title = ?, description = ?
    WHERE id = ?
  `, title, description, id);
};

export const deleteStudy = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Study
    WHERE id = ?
  `, id);
};

export const getProjects = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM Project`);
};

export const createProject = async (title, description) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Project (title, description)
    VALUES (?, ?)
  `, title, description);

  return result.lastID;
};

export const updateProject = async (id, title, description) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Project
    SET title = ?, description = ?
    WHERE id = ?
  `, title, description, id);
};

export const deleteProject = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Project
    WHERE id = ?
  `, id);
};

export const getPlaces = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM Place`);
};

export const createPlace = async (title, description) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Place (title, description)
    VALUES (?, ?)
  `, title, description);

  return result.lastID;
};

export const updatePlace = async (id, title, description) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Place
    SET title = ?, description = ?
    WHERE id = ?
  `, title, description, id);
};

export const deletePlace = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Place
    WHERE id = ?
  `, id);
};
