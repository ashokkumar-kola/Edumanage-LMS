// controllers/courseController.js
const courseService = require('./course.service');
const { validationResult } = require('express-validator');

exports.getCourses = async (req, res) => {
  try {
    // Validate query params
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const data = await courseService.getCourses(req.query);
    res.json(data);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error while fetching courses' });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    if (error.name === 'CastError') return res.status(404).json({ message: 'Course not found' });
    res.status(500).json({ message: 'Server error while fetching course' });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const result = await courseService.createCourse(req.user, req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error while creating course' });
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.instructorId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courses = await courseService.getInstructorCourses(req.params.instructorId);
    res.json(courses);
  } catch (error) {
    console.error('Get instructor courses error:', error);
    res.status(500).json({ message: 'Server error while fetching instructor courses' });
  }
};

exports.addMaterial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const material = await courseService.addMaterial(req.user, req.params.id, req.body);
    res.json({ message: 'Material added successfully', material });
  } catch (error) {
    console.error('Add material error:', error);
    res.status(500).json({ message: 'Server error while adding material' });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
    }

    const material = await courseService.updateMaterial(req.user, req.params.id, req.params.materialId, req.body);
    res.json({ message: 'Material updated successfully', material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ message: 'Server error while updating material' });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await courseService.deleteMaterial(req.user, req.params.id, req.params.materialId);
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ message: 'Server error while deleting material' });
  }
};

exports.approveCourse = async (req, res) => {
  try {
    const course = await courseService.approveCourse(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.json({ message: 'Course approved successfully', course });
  } catch (error) {
    console.error('Approve course error:', error);
    res.status(500).json({ message: 'Server error while approving course' });
  }
};

exports.getPendingCourses = async (req, res) => {
  try {
    const pendingCourses = await courseService.getPendingCourses();
    res.json(pendingCourses);
  } catch (error) {
    console.error('Get pending courses error:', error);
    res.status(500).json({ message: 'Server error while fetching pending courses' });
  }
};

exports.getCoursePerformance = async (req, res) => {
  try {
    const performanceData = await courseService.getCoursePerformance(req.user, req.params.id);
    res.json(performanceData);
  } catch (error) {
    console.error('Get course performance error:', error);
    res.status(500).json({ message: 'Server error while fetching course performance' });
  }
};
