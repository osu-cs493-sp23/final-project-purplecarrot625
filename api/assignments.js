const router = require("express").Router();
const { ObjectId } = require("mongodb");

const mongoose = require('mongoose')

const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const Course = require("../models/course");


exports.router = router;
/*
* POST /assignments - Route to create a new assignment.
*/
router.post('/', async (req, res) => {
    // Extract assignment details from request body
    const { title, points, courseId, due } = req.body;

    const assignment = new Assignment({
        _id: new mongoose.Types.ObjectId(),
        title,
        points,
        courseId,
        due
    });

    try {
        const result = await assignment.save();
        res.status(201).json({ id: result._id });
    } catch (error) {
        res.status(400).json({
            error: `Request body is not a valid assignment object.`,
            message: error.message

        });
    }
});

// GET: /assignments/{id}
router.get('/:id', async (req, res, next) => {
    const assignmentId = req.params.id;
    console.log(assignmentId);

    if (!ObjectId.isValid(assignmentId)) {
        return res.status(404).json({ error: 'Invalid assignment Id...' });
    }

    try {
        const assignment = await Assignment.findById(assignmentId).lean();

        if (assignment) {
            res.status(200).json(assignment);
        } else {
            res.status(404).json({ error: 'Assignment not found...' });
        }
    } catch (err) {
        res.status(404).json({ error: err });
    }
});

// PATCH: /assignments/{id}
router.patch('/:id', async (req, res, next) => {
    const assignmentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
        return res.status(404).json({ error: 'Invalid assignment Id...' });
    }

    const updateOps = {};

    if (Array.isArray(req.body)) {
        for (const ops of req.body) {
            updateOps[ops.propName] = ops.value;
        }
    } else if (typeof req.body === 'object') {
        for (const prop in req.body) {
            updateOps[prop] = req.body[prop];
        }
    } else {
        return res.status(400).json({ error: 'Invalid request payload...' });
    }

    try {
        await Assignment.updateOne({ _id: assignmentId }, { $set: updateOps }).exec();
        res.status(200).json({ message: 'Assignment updated...' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE: /assignments/{id}
router.delete('/:id', async (req, res) => {
    const assignmentId = req.params.id;

    if (!ObjectId.isValid(assignmentId)) {
        return res.status(404).json({ error: 'Invalid assignment Id...' });
    }

    try {
        const assignment = await Assignment.findByIdAndDelete(assignmentId);
        res.status(204).json({ message: 'Assignment deleted' });
    } catch (err) {
        res.status(404).json({ error: err });
    }
});

// GET: /assignments/{id}/submissions
router.get('/:id/submissions', async (req, res) => {
    const assignmentId = req.params.id;

    if (!ObjectId.isValid(assignmentId)) {
        return res.status(404).json({ error: 'Invalid assignment Id...' });
    }

    try {
        // TODO: Check user role and course instructor


        const course = await Course.findOne({ assignments: assignmentId });

        // if (!(user.role === 'admin' || (user.role === 'instructor' && user._id.toString() === course.instructorId.toString()))) {
        //     return res.status(403).json({ error: 'Forbidden' });
        // }

        const submissions = await Submission.find({ assignmentId }).lean()

        res.status(200).json(submissions);
    } catch (err) {
        if (err instanceof mongoose.CastError && err.kind === 'ObjectId') {
            res.status(404).json({ error: 'Assignment not found' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// POST: /assignments/{id}/submissions
router.post('/:id/submissions', async (req, res) => {
    const assignmentId = req.params.id;

    try {
        //TODO: Check user role and course enrollment
        // const user = req.userData;  // assuming userData is populated by checkAuth middleware
        const assignment = await Assignment.findById(assignmentId);
        const course = await Course.findOne({ _id: assignment.courseId });

        // if (user.role !== 'student' || !course.students.includes(user._id)) {
        //     return res.status(403).json({ error: 'Forbidden' });
        // }

        const submission = new Submission({
            ...req.body,
            assignmentId,
            studentId: "6458847ec687e3d3d5b7ec88",
        });

        const savedSubmission = await submission.save();
        res.status(201).json({ id: savedSubmission._id });

    } catch (err) {
        if (err instanceof mongoose.CastError && err.kind === 'ObjectId') {
            res.status(404).json({ error: 'Assignment not found' });
        } else {
            res.status(500).json({ error: err });
        }
    }
});