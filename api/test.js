const { saveFile } = require('../models/submission');

const testFile = {
  contentType: "testType",
  filename: "testName",
  path: "testPath",
  assignmentId: "testAssignmentId",
  studentId: "testStudentId",
  timestamp: new Date(),
  grade: null
};

async function testSaveFile() {
  try {
    const savedSubmissionId = await saveFile(testFile);
    console.log(`Save file success. Submission ID: ${savedSubmissionId}`);
  } catch (error) {
    console.log(`Save file failed. Error: ${error.message}`);
  }
}

testSaveFile();
