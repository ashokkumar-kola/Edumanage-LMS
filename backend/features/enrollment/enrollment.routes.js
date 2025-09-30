// routes/enrollment.js
const express = require('express');
const router = express.Router();

const { auth, authorize } = require('../../middleware/authMiddleware');
const enrollmentController = require('./enrollment.controller');
const enrollmentValidator = require('./enrollment.validation');

// Enroll in course
router.post(
  '/',
  auth,
  authorize('student'),
  enrollmentValidator.enrollValidator,
  enrollmentController.enrollStudent
);

// Student enrollments
router.get('/student/:studentId', auth, enrollmentController.getStudentEnrollments);

// Course enrollments
router.get('/course/:courseId', auth, authorize('instructor', 'admin'), enrollmentController.getCourseEnrollments);

// Drop enrollment
router.delete('/:id', auth, enrollmentController.dropEnrollment);

module.exports = router;
