import { getCagesForExperiment, addCageToExperiment, updateCage, deleteCage } from "./cageUtils";

import {  createGroup, createMouse, getMiceFull, updateGroup, updateMouse, updateMouseWithGroups, deleteGroup, deleteMouse, createMouseWithGroups } from "./mouseUtils";

import {
  getStudies, createStudy, updateStudy, deleteStudy,
  getProjects, createProject, updateProject, deleteProject,
  getPlaces, createPlace, updatePlace, deletePlace,
} from './metaUtils';

import {
  createExperimentator, updateExperimentator, deleteExperimentator,
  createDailyExperiment, updateDailyExperiment, deleteDailyExperiment,
  createExperiment, updateExperiment, deleteExperiment,
  getExperimentFull,
  createTrial, updateTrial, deleteTrial,
  createTrialLine, updateTrialLine, deleteTrialLine
} from './experimentUtils';




import { closeDatabase, dbPath, getDatabase } from "./databaseUtils";

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const dbScriptPath = path.join(__dirname, '..', 'databaseInit.ts');

const testMice = async () => {
  // Add a new Study
  let studyId = await createStudy("Study1", "This is study 1");

  // Add a new Group
  let group1Id = await createGroup("Group1", "This is group 1");

  // Add another Group
  let group2Id = await createGroup("Group2", "This is group 2");

  // Add a new Mouse linked to the above study and groups
  let mouseId = await createMouseWithGroups(43, studyId, [group1Id, group2Id]);

  // Retrieve full mouse information
  let result = await getMiceFull();
  console.log('After adding mouse:', result);
  // Expected output: Array containing one object with mouseId: <mouseId>, studyId: <studyId>, studyTitle: "Study1", and groups having details of "Group1" and "Group2"

  // Update the Study
  await updateStudy(studyId, "UpdatedStudy1", "This is updated study 1");

  // Update the Group
  await updateGroup(group1Id, "UpdatedGroup1", "This is updated group 1");
  await updateGroup(group2Id, "UpdatedGroup2", "This is updated group 2");

  // Update the Mouse
  await updateMouseWithGroups(mouseId, 69, studyId, [group1Id, group2Id]);

  result = await getMiceFull();
  console.log('After updating mouse:', result);
  // Expected output: Array containing one object with mouseId: <mouseId>, studyId: <studyId>, studyTitle: "UpdatedStudy1", and groups having updated details of "Group1" and "Group2"

  // Delete the Groups
  await deleteGroup(group1Id);
  await deleteGroup(group2Id);

  // Delete the Study
  await deleteStudy(studyId);

  // Delete the Mouse
  await deleteMouse(mouseId);

  result = await getMiceFull();
  console.log('After deleting mouse:', result);
  // Expected output: Empty array
};


const testCages = async () => {
  const m1 = await createMouse(1, 1);
  const m2 = await createMouse(1, 1);

  // Add a new cage
  const c = await addCageToExperiment(69, 1, [1, 2]);
  let result = await getCagesForExperiment(1);
  console.log('After adding cage:', result);

  // Update a cage
  await updateCage(1, 42, [2]);
  result = await getCagesForExperiment(1);
  console.log('After updating cage:', result);

  // Delete a cage
  await deleteCage(c);
  result = await getCagesForExperiment(1);
  console.log('After deleting cage:', result);

  await deleteMouse(m1);
  await deleteMouse(m2);
};

const testExperiments = async () => {

  // Add a new Project
  let projectId = await createProject("Test Project", "This is a test project.");
  console.log(`Project with id ${projectId} created`);

  // Add a new Place
  let placeId = await createPlace("Test Place", "This is a test place.");
  console.log(`Place with id ${placeId} created`);

  // Add a new Experimentator
  let experimentatorId = await createExperimentator("John", "Doe");
  console.log(`Experimentator with id ${experimentatorId} created`);

  // Add a new Experiment
  let experimentId = await createExperiment(projectId, "Test experiment", "Test objective", "Test animals description", "Test additional info", new Date());
  console.log(`Experiment with id ${experimentId} created`);


  await addCageToExperiment(69, experimentId, [1, 2]);
  await addCageToExperiment(42, experimentId, [2]);

  // Add a new Daily_Experiment
  let dailyExperimentId = await createDailyExperiment(experimentId, experimentatorId, placeId, new Date(), 25.5, 1000, 70);
  console.log(`Daily_Experiment with id ${dailyExperimentId} created`);

  // Add a new Trial
  let trialId = await createTrial(dailyExperimentId, "1h30m");
  console.log(`Trial with id ${trialId} created`);

  // Add a new Trial_Line
  let mouseId = 1;  // Assume this mouse ID is valid and exists in the database
  let trialLineId = await createTrialLine(mouseId, trialId, "15", 1);
  console.log(`Trial_Line with id ${trialLineId} created`);

  // Retrieve full experiment information
  let result = await getExperimentFull(experimentId);
  console.log('After creation:', JSON.stringify(result, null, 2));

  // Update the Project
  await updateProject(projectId, "Updated Test Project", "This is an updated test project.");
  console.log(`Project with id ${projectId} updated`);

  // Update the Place
  await updatePlace(placeId, "Updated Test Place", "This is an updated test place.");
  console.log(`Place with id ${placeId} updated`);

  // Update the Experimentator
  await updateExperimentator(experimentatorId, "John", "Smith");
  console.log(`Experimentator with id ${experimentatorId} updated`);

  // Update the Experiment
  await updateExperiment(experimentId, projectId, "Updated Test experiment", "Updated test objective", "Updated animals description", "Updated additional info", new Date());
  console.log(`Experiment with id ${experimentId} updated`);

  // Update the Daily_Experiment
  await updateDailyExperiment(dailyExperimentId, experimentId, experimentatorId, placeId, new Date(), 26.5, 1200, 75);
  console.log(`Daily_Experiment with id ${dailyExperimentId} updated`);

  // Update the Trial
  await updateTrial(trialId, dailyExperimentId, new Date());
  console.log(`Trial with id ${trialId} updated`);

  // Update the Trial_Line
  await updateTrialLine(mouseId, trialId, "20", 2);
  console.log(`Trial_Line updated`);

  // Retrieve full experiment information
  result = await getExperimentFull(experimentId);
  console.log('After update:', JSON.stringify(result, null, 2));

  // Delete the Trial_Line
  await deleteTrialLine(mouseId, trialId);
  console.log(`Trial_Line deleted`);

  // Delete the Trial
  await deleteTrial(trialId);
  console.log(`Trial with id ${trialId} deleted`);

  // Delete the Daily_Experiment
  await deleteDailyExperiment(dailyExperimentId);
  console.log(`Daily_Experiment with id ${dailyExperimentId} deleted`);

  // Delete the Experiment
  await deleteExperiment(experimentId);
  console.log(`Experiment with id ${experimentId} deleted`);

  // Delete the Experimentator
  await deleteExperimentator(experimentatorId);
  console.log(`Experimentator with id ${experimentatorId} deleted`);

  // Delete the Place
  await deletePlace(placeId);
  console.log(`Place with id ${placeId} deleted`);

  // Delete the Project
  await deleteProject(projectId);
  console.log(`Project with id ${projectId} deleted`);

  // The experiment should no longer exist, so we should receive 'undefined' or an error here
  try {
    let resultAfterDelete = await getExperimentFull(experimentId);
    console.log('After deletion:', JSON.stringify(resultAfterDelete, null, 2));
  } catch (err) {
    console.log(`Attempted to fetch deleted Experiment with id ${experimentId}, received error: ${err.message}`);
  }
};



const tests = [testMice, testCages, testExperiments];

export const resetDatabase = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Check if the database file exists
        if (fs.existsSync(dbPath)) {
            // Delete the database file
            fs.unlink(dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Run the database initialization script
                exec(`npx ts-node ${dbScriptPath}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`exec error: ${err}`);
                        reject(err);
                        return;
                    }

                    console.log(`stdout: ${stdout}`);
                    console.error(`stderr: ${stderr}`);
                    resolve();
                });
            });
        } else {
            // If the file does not exist, just run the database initialization script
            exec(`npx ts-node ${dbScriptPath}`, (err, stdout, stderr) => {
                if (err) {
                    console.error(`exec error: ${err}`);
                    reject(err);
                    return;
                }

                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                resolve();
            });
        }
    });
};

const sanityCheck = async () => {
  const db = await getDatabase();
  
  const study = await db.all(`SELECT * FROM Study`);
  console.log("Study:", study);
  
  const project = await db.all(`SELECT * FROM Project`);
  console.log("Project:", project);

  const place = await db.all(`SELECT * FROM Place`);
  console.log("Place:", place);

  const mice = await db.all(`SELECT * FROM Mouse`);
  console.log("Mice:", mice);
  
  const mouseGroupFamily = await db.all(`SELECT * FROM Mouse_Group_Family`);
  console.log("Mouse Group Family:", mouseGroupFamily);

  const mouseGroup = await db.all(`SELECT * FROM Mouse_Group`);
  console.log("Mouse Group:", mouseGroup);

  const cage = await db.all(`SELECT * FROM Cage`);
  console.log("Cage:", cage);

  const mouseCage = await db.all(`SELECT * FROM Mouse_Cage`);
  console.log("Mouse Cage:", mouseCage);

  const experiment = await db.all(`SELECT * FROM Experiment`);
  console.log("Experiment:", experiment);

  const cageExperiment = await db.all(`SELECT * FROM Cage_Experiment`);
  console.log("Cage Experiment:", cageExperiment);

  const experimentator = await db.all(`SELECT * FROM Experimentator`);
  console.log("Experimentator:", experimentator);

  const dailyExperiment = await db.all(`SELECT * FROM Daily_Experiment`);
  console.log("Daily Experiment:", dailyExperiment);

  const trial = await db.all(`SELECT * FROM Trial`);
  console.log("Trial:", trial);

  const trialLine = await db.all(`SELECT * FROM Trial_line`);
  console.log("Trial Line:", trialLine);
};


(async () => {
  await resetDatabase();
  for (let test of tests) {
    try {
      await test();
      console.log(`${test.name} passed`);
    } catch (error) {
      console.error(`${test.name} failed`);
      console.error(error);
    }
  }
  await sanityCheck();
  await closeDatabase();
})().catch(console.error);
