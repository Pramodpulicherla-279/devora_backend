const express = require('express');
const { getDomains, getDomain, createDomain, updateDomain, deleteDomain, assignCourse, removeCourse } = require('../controllers/domainController');

const router = express.Router();

router.route('/').get(getDomains).post(createDomain);
router.route('/:id').get(getDomain).put(updateDomain).delete(deleteDomain);
router.post('/:id/assign', assignCourse);
router.delete('/:id/courses/:courseId', removeCourse);

module.exports = router;
