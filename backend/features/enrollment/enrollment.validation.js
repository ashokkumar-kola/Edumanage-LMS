// validators/enrollmentValidator.js
const { body } = require('express-validator');

exports.enrollValidator = [
  body('courseId').notEmpty().withMessage('Course ID is required')
];
