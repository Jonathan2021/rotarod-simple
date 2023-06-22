// server/utils/mouseUtils.ts

import { getDatabase } from './databaseUtils';

const getMouseGroupFamilies = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM Mouse_Group_Family`);
};

const getMouseGroups = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM Mouse_Group`);
};

const getMice = async () => {
  const db = await getDatabase();

  return await db.all(`SELECT * FROM Mouse`);
};

export const createMouseGroupFamily = async (title, description) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Mouse_Group_Family (title, description)
    VALUES (?, ?)
  `, title, description);

  return result.lastID;
};

export const updateMouseGroupFamily = async (id, title, description) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse_Group_Family
    SET title = ?, description = ?
    WHERE id = ?
  `, title, description, id);
};

export const deleteMouseGroupFamily = async (id) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse_Group
    SET group_family_id = NULL
    WHERE group_family_id = ?
  `, id);

  await db.run(`
    DELETE FROM Mouse_Group_Family
    WHERE id = ?
  `, id);
};

export const createMouseGroup = async (groupFamilyId, title, description) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Mouse_Group (group_family_id, title, description)
    VALUES (?, ?, ?)
  `, groupFamilyId, title, description);

  return result.lastID;
};

export const updateMouseGroup = async (id, groupFamilyId, title, description) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse_Group
    SET group_family_id = ?, title = ?, description = ?
    WHERE id = ?
  `, groupFamilyId, title, description, id);
};

export const deleteMouseGroup = async (id) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse
    SET group_id = NULL
    WHERE group_id = ?
  `, id);

  await db.run(`
    DELETE FROM Mouse_Group
    WHERE id = ?
  `, id);
};

export const createMouse = async (studyId, groupId) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Mouse (study_id, group_id)
    VALUES (?, ?)
  `, studyId, groupId);

  return result.lastID;
};

export const updateMouse = async (id, studyId, groupId) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse
    SET study_id = ?, group_id = ?
    WHERE id = ?
  `, studyId, groupId, id);
};

export const deleteMouse = async (id) => {
  const db = await getDatabase();

  await db.run(`
    DELETE FROM Mouse
    WHERE id = ?
  `, id);
};

export const getMiceFull = async () => {
  const db = await getDatabase();

  const mice = await db.all(`
    SELECT Mouse.id as mouseId, Mouse_Group.id as groupId, Mouse_Group_Family.id as familyId,
    Mouse_Group_Family.title as familyTitle, Mouse_Group_Family.description as familyDescription, 
    Mouse_Group.title as groupTitle, Mouse_Group.description as groupDescription,
    Study.id as studyId, Study.title as studyTitle, Study.description as studyDescription
    FROM Mouse
    LEFT JOIN Mouse_Group ON Mouse.group_id = Mouse_Group.id
    LEFT JOIN Mouse_Group_Family ON Mouse_Group.group_family_id = Mouse_Group_Family.id
    LEFT JOIN Study ON Mouse.study_id = Study.id
  `);

  return mice;
};