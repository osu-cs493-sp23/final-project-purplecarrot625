const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  subject: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  term: {
    type: String,
    required: true
  },
  instructorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;

async function getCoursesPage(page, subject, number, term) {
    const pageSize = 10;

    // Build a query object based on provided filters
    const query = {};
    if (subject) query.subject = subject;
    if (number) query.number = number;
    if (term) query.term = term;

    const count = await Course.countDocuments(query);

    /*
     * Compute last page number and make sure page is within allowed bounds.
     * Compute offset into collection.
     */
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;

    const results = await Course.find(query)
        .sort({ _id: 1 })
        .skip(offset)
        .limit(pageSize);

    return {
        courses: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    };
}
exports.getCoursesPage = getCoursesPage;

/*
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
async function insertNewCourse(course) {
  course = extractValidFields(course, CourseSchema);
  const newCourse = new Course(course);
  const result = await newCourse.save();
  return result._id;
}
exports.insertNewCourse = insertNewCourse

/*
 * Executes a DB query to fetch detailed information about a single
 * specified course based on its ID,
 * Returns a Promise that resolves to an object containing
 * information about the requested business.  If no course with the
 * specified ID exists, the returned Promise will resolve to null.
 */
async function getCourseById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  } else {
    const result = await Course.findById(id);
    return result;
  }
}
exports.getCourseById = getCourseById

async function updateCourseById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  } else {
    const result = await Course.findByIdAndUpdate(id);
    return result;
  }
}
exports.updateCourseById = updateCourseById

async function updateCourseById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  } else {
    const result = await Course.findByIdAndUpdate(id);
    return result;
  }
}
exports.updateCourseById = updateCourseById