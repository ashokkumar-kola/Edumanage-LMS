// controllers/enrollmentController.js
const enrollmentService = require('./enrollment.service');
const { validationResult } = require('express-validator');

exports.enrollStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const result = await enrollmentService.enrollStudent(req.user, req.body.courseId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: error.message || 'Server error during enrollment' });
  }
};

exports.getStudentEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getStudentEnrollments(req.user, req.params.studentId);
    res.json(enrollments);
  } catch (error) {
    console.error('Get student enrollments error:', error);
    res.status(500).json({ message: error.message || 'Server error while fetching enrollments' });
  }
};

exports.getCourseEnrollments = async (req, res) => {
  try {
    const enrollments = await enrollmentService.getCourseEnrollments(req.user, req.params.courseId);
    res.json(enrollments);
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({ message: error.message || 'Server error while fetching course enrollments' });
  }
};

exports.dropEnrollment = async (req, res) => {
  try {
    await enrollmentService.dropEnrollment(req.user, req.params.id);
    res.json({ message: 'Dropped from course successfully' });
  } catch (error) {
    console.error('Drop course error:', error);
    res.status(500).json({ message: error.message || 'Server error while dropping course' });
  }
};
