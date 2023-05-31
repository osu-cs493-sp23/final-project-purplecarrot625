/*
 * API sub-router for courses collection endpoints.
 */

const { Router } = require('express')

// const { validateAgainstSchema } = require('../lib/validation')
const {
    CourseSchema,
    getCoursesPage,
    insertNewCourse,
    getCourseById,
    updateCourseById
} = require('../models/course')

const router = Router()

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
    if (validateAgainstSchema(req.body, courseSchema)) {
        try {
            const id = await insertNewCourse(req.body)
            res.status(201).send({
                id: id
            })
        } catch (err) {
            next(err)
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid course object."
        })
    }
})

/*
 * GET /courses/{id} - Route to fetch info about a specific courses.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const course = await getCourseById(req.params.id)
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
 * Patch /courses/{id} - Route to fetch info about a specific courses.
 */
router.patch('/:id', async (req, res, next) => {
    try {
        const course = await updateCourseById(req.params.id,req.body)
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

exports.router = router