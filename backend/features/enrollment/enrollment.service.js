// services/enrollmentService.js
const Enrollment = require('./Enrollment');
const Course = require('../course/Course');

exports.enrollStudent = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course || !course.isActive) throw new Error('Course not found or not available');
  if (!course.isApproved) throw new Error('Course is pending approval and not available for enrollment');

  const existingEnrollment = await Enrollment.findOne({
    student: user._id,
    course: courseId
  });
  if (existingEnrollment) throw new Error('Already enrolled in this course');

  if (course.currentEnrollment >= course.maxStudents) throw new Error('Course is full');

  const enrollment = new Enrollment({ student: user._id, course: courseId });
  await enrollment.save();

  await Course.findByIdAndUpdate(courseId, { $inc: { currentEnrollment: 1 } });

  await enrollment.populate([
    { path: 'student', select: 'firstName lastName email' },
    { path: 'course', select: 'title courseCode instructor' }
  ]);

  return { message: 'Enrolled successfully', enrollment };
};

exports.getStudentEnrollments = async (user, studentId) => {
  if (user.role === 'student' && studentId !== user._id.toString()) throw new Error('Access denied');

  const enrollments = await Enrollment.find({ student: studentId })
    .populate('course', 'title courseCode instructor credits fees')
    .populate({
      path: 'course',
      populate: { path: 'instructor', select: 'firstName lastName' }
    })
    .sort({ enrollmentDate: -1 });

  return enrollments;
};

exports.getCourseEnrollments = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) throw new Error('Course not found');

  if (user.role === 'instructor' && course.instructor.toString() !== user._id.toString()) {
    throw new Error('Access denied');
  }

  const enrollments = await Enrollment.find({ course: courseId })
    .populate('student', 'firstName lastName email profileImage')
    .sort({ enrollmentDate: -1 });

  return enrollments;
};

exports.dropEnrollment = async (user, enrollmentId) => {
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw new Error('Enrollment not found');

  if (user.role === 'student' && enrollment.student.toString() !== user._id.toString()) {
    throw new Error('Access denied');
  }

  enrollment.status = 'dropped';
  await enrollment.save();

  await Course.findByIdAndUpdate(enrollment.course, { $inc: { currentEnrollment: -1 } });
};
