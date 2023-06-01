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
  deleteAssignment
} = require("../models/assignment");

const {
  Submission,
  saveFileInfo,
  saveFile,
  getFileById,
  getFileDownloadStreamByFilename,
  getFileByAssignmetnId
} = require("../models/submission");



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
router.patch("/:id", async (req, res, next) => {
  const assignmentId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(404).json({ error: "Invalid assignment Id..." });
  }

  const updateOps = {};

  if (Array.isArray(req.body)) {
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
  } else if (typeof req.body === "object") {
    for (const prop in req.body) {
      updateOps[prop] = req.body[prop];
    }
  } else {
    return res.status(400).json({ error: "Invalid request payload..." });
  }

  try {
    await updateAssignment(assignmentId, updateOps);
    res.status(200).json({ message: "Assignment updated..." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: /assignments/{id}
router.delete("/:id", async (req, res) => {
  const assignmentId = req.params.id;

  if (!ObjectId.isValid(assignmentId)) {
    return res.status(404).json({ error: "Invalid assignment Id..." });
  }

  try {
    await deleteAssignment(assignmentId);
    res.status(204).json({ message: "Assignment deleted..." });
  } catch (err) {
    res.status(404).json({ error: err });
  }
});

// GET: /assignments/{id}/submissions
router.get("/:id/submissions", async (req, res) => {
  const assignmentId = req.params.id;
  console.log(assignmentId);

  if (!ObjectId.isValid(assignmentId)) {
    return res.status(404).json({ error: "Invalid assignment Id..." });
  }

  try {
    // TODO: Check user role and course instructor

    // if (!(user.role === 'admin' || (user.role === 'instructor' && user._id.toString() === course.instructorId.toString()))) {
    //     return res.status(403).json({ error: 'Forbidden' });
    // }

    const submissions = await getFileByAssignmetnId(assignmentId);

    res.status(200).json(submissions);
  } catch (err) {
    if (err instanceof mongoose.CastError && err.kind === "ObjectId") {
      res.status(404).json({ error: "Submission not found" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// POST: /assignments/{id}/submissions
router.post("/:id/submissions", upload.single("file"), async (req, res) => {
  console.log("--req.body--", req.body);
  console.log("--req.file--", req.file);
  console.log({ Submission, saveFileInfo, saveFile, getFileById, getFileDownloadStreamByFilename });

  if (req.file && req.body && req.body.studentId && req.body.assignmentId) {
    const assignmentId = req.params.id;
    const file = {
      contentType: req.file.mimetype,
      filename: req.file.filename,
      path: req.file.path,
      assignmentId: assignmentId,
      studentId: "6458847ec687e3d3d5b7ec88",
      timestamp: new Date(),
      grade: req.body.grade,
    };
    //TODO: Check user role and course enrollment

    // Save file
    console.log("------start to save file------")
    const savedSubmissionId = await saveFile(file);
    res.status(201).json({ id: savedSubmissionId });
  } else {
    res
      .status(400)
      .json({ error: "Request body is not a valid submission object" });
  }
});
