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

export const createMouseGroupFamily = async (name) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Mouse_Group_Family (name)
    VALUES (?)
  `, name);

  return result.lastID;
};

export const updateMouseGroupFamily = async (id, name) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse_Group_Family
    SET name = ?
    WHERE id = ?
  `, name, id);
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

export const createMouseGroup = async (groupFamilyId, precision) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Mouse_Group (group_family_id, precision)
    VALUES (?, ?)
  `, groupFamilyId, precision);

  return result.lastID;
};

export const updateMouseGroup = async (id, groupFamilyId, precision) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse_Group
    SET group_family_id = ?, precision = ?
    WHERE id = ?
  `, groupFamilyId, precision, id);
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

export const createMouse = async (groupId) => {
  const db = await getDatabase();

  const result = await db.run(`
    INSERT INTO Mouse (group_id)
    VALUES (?)
  `, groupId);

  return result.lastID;
};

export const updateMouse = async (id, groupId) => {
  const db = await getDatabase();

  await db.run(`
    UPDATE Mouse
    SET group_id = ?
    WHERE id = ?
  `, groupId, id);
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
    Mouse_Group_Family.name as familyName, Mouse_Group.precision as groupPrecision
    FROM Mouse
    LEFT JOIN Mouse_Group ON Mouse.group_id = Mouse_Group.id
    LEFT JOIN Mouse_Group_Family ON Mouse_Group.group_family_id = Mouse_Group_Family.id
  `);

  return mice;
};