// validators/courseValidator.js
const { body, query } = require('express-validator');

exports.getCoursesValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim(),
  query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  query('search').optional().trim()
];

exports.createCourseValidator = [
  body('title').trim().notEmpty().withMessage('Course title is required'),
  body('description').trim().notEmpty().withMessage('Course description is required'),
  body('courseCode').trim().notEmpty().withMessage('Course code is required'),
  body('credits').isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  body('maxStudents').isInt({ min: 1 }).withMessage('Maximum students must be at least 1'),
  body('fees').isFloat({ min: 0 }).withMessage('Fees must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level')
];

exports.materialValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['pdf', 'video', 'link', 'document', 'note']).withMessage('Invalid material type'),
  body('url').notEmpty().withMessage('URL is required'),
  body('isFree').optional().isBoolean().withMessage('isFree must be boolean')
];

exports.updateMaterialValidator = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('type').optional().isIn(['pdf', 'video', 'link', 'document', 'note']).withMessage('Invalid material type'),
  body('url').optional().notEmpty().withMessage('URL cannot be empty'),
  body('isFree').optional().isBoolean().withMessage('isFree must be boolean')
];
