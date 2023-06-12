const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const {User} = require('./user');
const { Assignment } = require('./assignment');
const ObjectId = require('mongoose').Types.ObjectId;

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
    required: true
  },
  students: [{
    type: Schema.Types.ObjectId
  }],

  assignments:[{
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  }]
});

const Course = mongoose.model('Course', CourseSchema);

// module.exports = Course;

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
        .select('-students -assignments')
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
  try {
    const newCourse = new Course(course);
    const result = await newCourse.save();
    return result._id;
  } catch (err) {
    console.log("Error in insertNewUser:", err) // Log the entire error.
    return null;
  }
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
  const result = await Course.findById(id).select('-students -assignments');
  return result;
}
exports.getCourseById = getCourseById

async function updateCourseById(id, requestedBody) {
  delete requestedBody.students;
  delete requestedBody.assignments;

  const result = await Course.findByIdAndUpdate(id, requestedBody, { lean: true })
  return result
}
exports.updateCourseById = updateCourseById

async function deleteCourseById(id) {
  const result = await Course.findByIdAndRemove(id);
  const deleteAssignments = await Assignment.deleteMany({ courseId: id });
  return result;
}
exports.deleteCourseById = deleteCourseById

async function getStudentsByCourseId(id) {
  console.log("== getStudentsByCourseId()")
  const course = await Course.findById(id);
  if (!course) {
    return null
  }
  // Get the students
  const result = await User.find({ _id: { $in: course.students } });
  return result
}
exports.getStudentsByCourseId = getStudentsByCourseId

async function updateStudentByCourseId(id, add, remove) {
  const course = await Course.findById(id);
  if (!course) {
    return null
  }
  if (add) {
    await Course.updateOne({ _id: id }, { $addToSet: { students: { $each: add } } });
  }

  if (remove) {
    await Course.updateOne({ _id: id }, { $pullAll: { students: remove } });
  }
  const updatedCourse = await Course.findById(id);
  return { students: updatedCourse.students };
}
exports.updateStudentByCourseId = updateStudentByCourseId

async function getRosterByCourseId(id) {
  const course = await Course.findById(id);
  if (!course) {
    return null
  }

  const students = await User.find({ _id: { $in: course.students } });
  let csv = '';
  students.forEach(student => {
    csv += `${student._id},${student.name},${student.email}\n`;
  });
  return csv;
}
exports.getRosterByCourseId = getRosterByCourseId;

async function getAssignmentsByCourseId(id) {
  const course = await Course.findById(id);
  if (!course) {
    return null
  }
  const assignmentsList = await Assignment.find({ courseId: id });
  return assignmentsList
}
exports.getAssignmentsByCourseId = getAssignmentsByCourseId

async function bulkInsertNewCourses(courses) {
  try {
    const result = await Course.insertMany(courses);
    return result.map(doc => doc._id);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
exports.bulkInsertNewCourses = bulkInsertNewCourses;

// Get all courses where the instructor id is a match
async function getCoursesByInstructorId(id) {
  id = new ObjectId(id);
  try {
    const courses = await Course.find({ instructorId: id });
    console.log("== courses:", courses);
    return courses;
  } catch (err) {
    console.log(`Error getting courses by instructor id: ${err}`);
    return null;
  }
}
exports.getCoursesByInstructorId = getCoursesByInstructorId;

// Get all courses where the student's id is in the students array
async function getCoursesByStudentId(id) {
  id = new ObjectId(id);
  try {
    const courses = await Course.find({ students: id });
    console.log("== courses:", courses);
    return courses;
  } catch (err) {
    console.log(`Error getting courses by student id: ${err}`);
    return null;
  }
}
exports.getCoursesByStudentId = getCoursesByStudentId;
