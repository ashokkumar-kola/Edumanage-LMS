const Course = require('./Course');
const Enrollment = require('../enrollment/Enrollment');
const mongoose = require("mongoose")
exports.getCourses = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  let filter = { isActive: true };
  if (query.category) filter.category = query.category;
  if (query.level) filter.level = query.level;
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { courseCode: { $regex: query.search, $options: 'i' } }
    ];
  }

  const courses = await Course.find(filter)
    .populate('instructor', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Course.countDocuments(filter);

  return {
    courses,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

exports.getCourseById = async (id) => {
  return Course.findById(id).populate('instructor', 'firstName lastName email profileImage');
};

exports.createCourse = async (user, body) => {
  const existingCourse = await Course.findOne({ courseCode: body.courseCode.toUpperCase() });
  if (existingCourse) throw new Error('Course code already exists');

  const courseData = {
    ...body,
    instructor: user._id,
    courseCode: body.courseCode.toUpperCase(),
    isApproved: false
  };

  const course = new Course(courseData);
  await course.save();
  await course.populate('instructor', 'firstName lastName email');

  return {
    message: 'Course created successfully. Pending admin approval.',
    course
  };
};

exports.getInstructorCourses = async (instructorId) => {
  return Course.find({ instructor: instructorId, isActive: true })
    .populate('instructor', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

exports.approveCourse = async (id) => {
  return Course.findByIdAndUpdate(id, { isApproved: true }, { new: true })
    .populate('instructor', 'firstName lastName email');
};

exports.getPendingCourses = async () => {
  return Course.find({ isApproved: false, isActive: true })
    .populate('instructor', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// ✅ keep course performance untouched
exports.getCoursePerformance = async (user, courseId) => {
  const Assignment = require('../assignments/Assignment');
  const Submission = require('../submissions/Submission');
  const Grade = require('../grades/Grade');

  const course = await Course.findById(courseId);
  if (!course) throw new Error('Course not found');

  if (user.role !== 'admin' && course.instructor.toString() !== user._id.toString()) {
    throw new Error('Access denied');
  }

  const enrollments = await Enrollment.find({ course: courseId, status: 'enrolled' })
    .populate('student', 'firstName lastName');

  const totalStudents = enrollments.length;

  const assignments = await Assignment.find({ course: courseId, isPublished: true });
  const totalAssignments = assignments.length;

  const submissions = await Submission.find({
    assignment: { $in: assignments.map(a => a._id) }
  }).populate([
    { path: 'assignment', select: 'title totalPoints' },
    { path: 'student', select: 'firstName lastName' }
  ]);

  const grades = await Grade.find({ course: courseId });

  let completionRate = 0;
  if (totalStudents > 0 && totalAssignments > 0) {
    const studentCompletions = {};
    submissions.forEach(submission => {
      const studentId = submission.student._id.toString();
      studentCompletions[studentId] = (studentCompletions[studentId] || 0) + 1;
    });
    const studentsWithGoodCompletion = Object.values(studentCompletions)
      .filter(count => count >= (totalAssignments * 0.8)).length;
    completionRate = (studentsWithGoodCompletion / totalStudents) * 100;
  }

  let submissionRate = 0;
  if (totalStudents > 0 && totalAssignments > 0) {
    submissionRate = (submissions.length / (totalStudents * totalAssignments)) * 100;
  }

  let averageGrade = 0;
  let averageSatisfaction = 0;
  if (grades.length > 0) {
    const totalPercentage = grades.reduce((sum, grade) => sum + (grade.percentage || 0), 0);
    averageGrade = totalPercentage / grades.length;
    if (averageGrade >= 70) {
      averageSatisfaction = 3.0 + ((averageGrade - 70) / 30) * 2.0;
    } else {
      averageSatisfaction = (averageGrade / 70) * 3.0;
    }
    averageSatisfaction = Math.min(5.0, Math.max(1.0, averageSatisfaction));
  }

  const assignmentStats = assignments.map(assignment => {
    const assignmentSubmissions = submissions.filter(s => s.assignment._id.toString() === assignment._id.toString());
    return {
      assignmentId: assignment._id,
      title: assignment.title,
      totalSubmissions: assignmentSubmissions.length,
      submissionRate: totalStudents > 0 ? (assignmentSubmissions.length / totalStudents) * 100 : 0,
      averageGrade: assignmentSubmissions.length > 0
        ? assignmentSubmissions.reduce((sum, s) => sum + (s.grade?.percentage || 0), 0) / assignmentSubmissions.length
        : 0
    };
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSubmissions = submissions.filter(s => new Date(s.submittedAt) >= sevenDaysAgo).length;

  return {
    courseId,
    courseTitle: course.title,
    totalStudents,
    totalAssignments,
    totalSubmissions: submissions.length,
    completionRate: Math.round(completionRate * 100) / 100,
    submissionRate: Math.round(submissionRate * 100) / 100,
    averageGrade: Math.round(averageGrade * 100) / 100,
    averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
    assignmentStats,
    recentActivity: {
      recentSubmissions,
      newEnrollments: enrollments.filter(e => new Date(e.enrollmentDate) >= sevenDaysAgo).length
    },
    gradeDistribution: {
      'A': grades.filter(g => g.letterGrade && g.letterGrade.startsWith('A')).length,
      'B': grades.filter(g => g.letterGrade && g.letterGrade.startsWith('B')).length,
      'C': grades.filter(g => g.letterGrade && g.letterGrade.startsWith('C')).length,
      'D': grades.filter(g => g.letterGrade && g.letterGrade.startsWith('D')).length,
      'F': grades.filter(g => g.letterGrade === 'F').length
    }
  };
};


exports.getCourseWithModulesAndLectures = async (courseId) => {
  const course = await Course.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
    {
      $lookup: {
        from: "modules",
        localField: "_id",
        foreignField: "courseId",
        as: "modules"
      }
    },
    {
      $lookup: {
        from: "lectures",
        localField: "modules._id",
        foreignField: "moduleId",
        as: "lectures"
      }
    },
    {
      $addFields: {
        modules: {
          $map: {
            input: "$modules",
            as: "m",
            in: {
              $mergeObjects: [
                "$$m",
                {
                  lectures: {
                    $filter: {
                      input: "$lectures",
                      as: "l",
                      cond: { $eq: ["$$l.moduleId", "$$m._id"] }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    },
    { $project: { lectures: 0 } } // remove flat lectures array
  ]);

  return course[0] || null;
};