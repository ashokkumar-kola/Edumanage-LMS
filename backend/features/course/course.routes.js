// routes/course.js
const express = require('express');
const router = express.Router();

const { auth, authorize, checkApproval } = require('../../middleware/authMiddleware');
const courseController = require('./course.controller');
const courseValidator = require('./course.validation');

// Public
router.get('/', courseValidator.getCoursesValidator, courseController.getCourses);
router.get('/:id', courseController.getCourseById);

// Instructor only
router.post('/', 
  auth,
  authorize('instructor'),
  checkApproval,
  courseValidator.createCourseValidator,
  courseController.createCourse
);

router.get('/instructor/:instructorId', auth, courseController.getInstructorCourses);

// Materials
router.post('/:id/material', 
  auth, 
  authorize('instructor', 'admin'),
  courseValidator.materialValidator,
  courseController.addMaterial
);

router.put('/:id/material/:materialId', 
  auth,
  authorize('instructor', 'admin'),
  courseValidator.updateMaterialValidator,
  courseController.updateMaterial
);

router.delete('/:id/material/:materialId', 
  auth,
  authorize('instructor', 'admin'),
  courseController.deleteMaterial
);

// Admin
router.put('/:id/approve', auth, authorize('admin'), courseController.approveCourse);
router.get('/pending', auth, authorize('admin'), courseController.getPendingCourses);

// Performance
router.get('/:id/performance', auth, authorize(['instructor', 'admin']), courseController.getCoursePerformance);

module.exports = router;
