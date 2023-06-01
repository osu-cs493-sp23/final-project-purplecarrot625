/*
 * API sub-router for courses collection endpoints.
 */

const { Router } = require('express')

// const { validateAgainstSchema } = require('../lib/validation')

const {
    getCoursesPage,
    insertNewCourse,
    getCourseById,
    updateCourseById,
    deleteCourseById,
    getStudentsByCourseId,
    updateStudentByCourseId,
    getRosterByCourseId,
    getAssignmentsByCourseId,
} = require('../models/course');

const router = Router()

const { ObjectId } = require('mongodb');
const { default: mongoose } = require('mongoose');

/*
 * GET /courses - Route to return a paginated list of courses.
 */
router.get('/', async (req, res, next) => {
    try {
        /*
         * Fetch page info, generate HATEOAS links for surrounding pages and then
         * send response.
         */
        const page = parseInt(req.query.page) || 1;
        const subject = req.query.subject;
        const number = req.query.number;
        const term = req.query.term;

        const coursePage = await getCoursesPage(page, subject, number, term);
        coursePage.links = {};
        if (coursePage.page < coursePage.totalPages) {
            coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`;
            coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`;
        }
        if (coursePage.page > 1) {
            coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`;
            coursePage.links.firstPage = '/courses?page=1';
        }
        res.status(200).send(coursePage);
    } catch (err) {
        next(err);
    }
});

/*
 * POST /courses - Route to create a new course.
 */
router.post('/', async (req, res) => {
    try {
        const id = await insertNewCourse(req.body)
        res.status(201).send({
            id: id
        })
    }catch(error) {
        if (error instanceof mongoose.Error.ValidationError) {
          console.error('ValidationError:', error.message);
          res.status(400).json({
            error: "Request body is not a valid business object"
          });
        } else {
          console.error('An unexpected error occurred:', error);
          res.status(500).json({
            error: "An unexpected error occurred"
          });
        }
    }
})

/*
 * GET /courses/{id} - Route to fetch info about a specific courses.
 */
router.get('/:id', async (req, res, next) => {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
        return res.status(404).json({ error: "Course not found" });
      }
    try {
        const course = await getCourseById(courseId)
        if (course) {
            res.status(200).send(course)
        } else {
            res.status(404).send({
                error: "Request course not found."
            })
        }
    } catch (err) {
        next(err)
    }
})

/*
 * Patch /courses/{id} - Route to update info about a specific courses.
 */
router.patch('/:id', async (req, res, next) => {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
        return res.status(404).json({ error: "Course not found" });
      }
    try {
        const course = await updateCourseById(courseId, req.body)
        if (course) {
            res.status(200).send(course)
        } else {
            res.status(404).send({
                error: "Request course not found."
            })
        }
    }catch(err) {
        res.status(400).json({
          error: "Request body is not a valid course object"
        });
    }
})

/*
 * Delete /courses/{id} - Route to delete a specific courses.
 */
router.delete('/:id', async (req, res, next) => {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
        return res.status(404).json({ error: "Course not found" });
      }
    try {
        const course = await deleteCourseById(courseId)
        if (course) {
            res.status(204).send(course)
        } else {
            res.status(404).send({
                error: "Request course not found."
            })
        }
    }catch(err) {
        res.status(400).json({
          error: "Request body is not a valid course object"
        });
    }
})

/*
 * GET /courses/{id}/students - Route to fetch a list of the students enrolled in the Course.
 */
router.get('/:id/students', async (req, res, next) => {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
        return res.status(404).json({ error: "Course not found" });
      }
    try {
        const studentList = await getStudentsByCourseId(courseId)
        if (studentList) {
            res.status(200).send(studentList)
        } else {
            res.status(404).send({
                error: "Request course not found."
            })
        }
    } catch (err) {
        next(err)
    }
})

/*
 * POST /courses/{id}/students - Route to update enrollment for a Course.
 */
router.post('/:id/students', async (req, res, next) => {
    const courseId = req.params.id;
    const { add, remove } = req.body;
    if (!ObjectId.isValid(courseId)) {
        return res.status(404).json({ error: "Course not found" });
    }
    if (!add && !remove) {
        return res.status(400).json({ error: 'The request body was either not present or did not contain the fields described above.' });
    }
    try {
        const result = await updateStudentByCourseId(courseId, add, remove)
        if (result) {
            res.status(200).send(result)
        } else {
            res.status(404).send({
                error: "Request course not found."
            })
        }
    } catch (err) {
        next(err)
    }
})

/*
 * GET /courses/{id}/roster - Route to fetch a CSV file containing list of the students enrolled in the Course.
 */
router.get('/:id/roster', async (req, res, next) => {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
        return res.status(404).json({ error: "Course not found" });
      }
    try {
        const course = await getRosterByCourseId(courseId)
        if (course) {
            res.status(200).send(course)
        } else {
            res.status(404).send({
                error: "Request course not found."
            })
        }
    } catch (err) {
        next(err)
    }
})

/*
 * GET /courses/{id}/assignments  Route to fetch a list of the Assignments for the Course.
 */
router.get('/:id/assignments', async (req, res, next) => {
    const courseId = req.params.id;
    if (!ObjectId.isValid(courseId)) {
        return res.status(404).json({ error: "Course not found" });
      }
    try {
        const assignmentList = await getAssignmentsByCourseId(courseId)
        if (assignmentList) {
            res.status(200).send(assignmentList)
        } else {
            res.status(404).send({
                error: "Request course not found."
            })
        }
    } catch (err) {
        next(err)
    }
})

exports.router = router