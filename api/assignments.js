const router = require("express").Router();
const { ObjectId } = require("mongodb");
const { options } = require(".");
const multer = require("multer");
const crypto = require("node:crypto");
const { connectToDb } = require("../lib/mongo");

const mongoose = require("mongoose");

const {
  Assignment,
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  getCourseIdByAssignmentId,
} = require("../models/assignment");

const {
  Submission,
  saveFileInfo,
  saveFile,
  getFileById,
  getFileDownloadStreamByFilename,
  getStudentSubmissionByAssignmentId,
  deleteSubmissionsOfAssignment
} = require("../models/submission");

const { getCourseById, getStudentsByCourseId } = require("../models/course");

const { requireAuthentication } = require("../lib/auth");



const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      console.log("== file:", file);
      const filename = crypto.pseudoRandomBytes(16).toString("hex");
      const extension = file.mimetype.split("/")[1];
      callback(null, `${filename}.${extension}`);
    },
  }),
});

exports.router = router;
/*
 * POST /assignments - Route to create a new assignment.
 */
router.post("/", async (req, res) => {
  // Extract assignment details from request body
  const { title, points, courseId, due } = req.body;


  try {
    const result = await createAssignment({ title, points, courseId, due });
    res.status(201).json({ id: result._id });
  } catch (error) {
    res.status(400).json({
      error: `Request body is not a valid assignment object.`,
      message: error.message,
    });
  }
});

// GET: /assignments/{id}
router.get("/:id", async (req, res, next) => {
  const assignmentId = req.params.id;
  console.log(assignmentId);

  if (!ObjectId.isValid(assignmentId)) {
    return res.status(404).json({ error: "Invalid assignment Id..." });
  }

  try {
    const assignment = await getAssignmentById(assignmentId);

    if (assignment) {
      res.status(200).json(assignment);
    } else {
      res.status(404).json({ error: "Assignment not found..." });
    }
  } catch (err) {
    res.status(404).json({ error: err });
  }
});

// PATCH: /assignments/{id}
router.patch("/:id", requireAuthentication, async (req, res, next) => {
  const assignmentId = req.params.id;
  const courseId = await getCourseIdByAssignmentId(assignmentId);
  const course = await getCourseById(courseId);
  const instructorId = course.instructorId;

  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(404).json({ error: "Invalid assignment Id..." });
  }

  // Only admin or instructor can update the assignment.
  if (req.user.role == "admin" || req.user.role == "instructor" && instructorId == course.instructorId) {
    const updateOps = {};
    if (Array.isArray(req.body)) {
      for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
      }
    } else if (typeof req.body === "object") {
      for (const prop in req.body) {
        if (prop !== "courseId") {
          updateOps[prop] = req.body[prop];
        }
      }
    } else {
      return res.status(400).json({ error: "Invalid request payload..." });
    }

    try {
      await updateAssignment(assignmentId, updateOps);
      res.status(200).json({ message: "Assignment updated...", updateOps, yourRole: req.user.role });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Only instructor or admin can update the assignment" });
  }
});

// DELETE: /assignments/{id}
router.delete("/:id", requireAuthentication, async (req, res) => {
  const assignmentId = req.params.id;
  if (getAssignmentById(assignmentId) == null ){
    return res.status(404).json({ error: "Assignment not found..." });
  }
  if (!ObjectId.isValid(assignmentId)) {
    return res.status(404).json({ error: "Invalid assignment Id..." });
  }

  const courseId = await getCourseIdByAssignmentId(assignmentId);
  const course = await getCourseById(courseId);
  if (course === null) {
    return res.status(404).json({ error: "Assignment not found..." });
  }
  const instructorId = course.instructorId;



  // Only admin or instructor can delete the assignment.
  if (req.user.role == "admin" || req.user.role == "instructor" && instructorId == course.instructorId) {
    try {
      await deleteAssignment(assignmentId);
      await deleteSubmissionsOfAssignment(assignmentId)
      return res.status(204).send({ message: "Assignment deleted..." });
    } catch (err) {
      res.status(404).json({ error: err });
    }
  } else {
    res.status(403).json({ error: "Only instructor or admin can delete the assignment" });
  }
});

// GET: /assignments/{id}/submissions
router.get("/:id/submissions", requireAuthentication, async (req, res) => {
  const assignmentId = req.params.id;
  const studentId = req.query.studentId;
  const courseId = await getCourseIdByAssignmentId(assignmentId);
  const course = await getCourseById(courseId);
  const instructorId = course.instructorId;


  const page = parseInt(req.query.page) || 1;
  const pageSize = 10

  console.log("== courseId:", courseId);
  console.log("== assignmentId:", assignmentId);
  console.log("== studentId:", studentId);
  console.log("== page:", page);

  if (!ObjectId.isValid(assignmentId)) {
    return res.status(404).json({ error: "Invalid assignment Id..." });
  }

  if (req.user.role === "admin" || req.user.role === "instructor" && instructorId == course.instructorId) {
    try {
      console.log("Welcome:", req.user.role);
      const submissions = await getStudentSubmissionByAssignmentId(assignmentId, studentId, page, pageSize);
      res.status(200).json(submissions);
    } catch (err) {
      if (err instanceof mongoose.CastError && err.kind === "ObjectId") {
        res.status(404).json({ error: "Submission not found" });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  } else {
    res.status(403).json({ error: "Unauthorized to access the specified resource" });
  }
});

// POST: /assignments/{id}/submissions
router.post("/:id/submissions", upload.single("file"), async (req, res) => {
  console.log("--req.body--", req.body);
  console.log("--req.file--", req.file);
  console.log("--req.user--", req.user);
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Only student can submit the assignment" });
  }
  const assignmentId = req.params.id;
  if (req.body && req.body.studentId && assignmentId) {
    const file = {
      contentType: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
      assignmentId: assignmentId,
      studentId: req.body.studentId,
      timestamp: new Date(),
      grade: null,
    };
    // Check user role and course enrollment
    const courseId = await getCourseIdByAssignmentId(assignmentId);
    const studentsEnrollments = await getStudentsByCourseId(courseId);
    console.log("== studentsEnrollments:", studentsEnrollments);
    console.log("== req.body.studentId:", req.body.studentId)
    const studentIsEnrolled = studentsEnrollments && studentsEnrollments.some && studentsEnrollments.some(student => String(student._id) === String(req.body.studentId));
    console.log("== studentIsEnrolled:", studentIsEnrolled);

    if (studentIsEnrolled == false) {
      return res.status(403).json({ error: "Student is not enrolled in the course" });
    }
    // Save file
    console.log("------start to save file------")
    const savedSubmissionId = await saveFile(file);
    // Updatethe submissionId in assignment

    res.status(201).json({ id: savedSubmissionId });
  } else {
    res
      .status(400)
      .json({ error: "Request body is not a valid submission object" });
  }
});
