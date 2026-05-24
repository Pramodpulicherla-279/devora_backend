const express = require('express');
const { generateQuiz, generateInterviewQuestions, generateVisualization, generateTheory, generateTags } = require('../controllers/aiController');

const router = express.Router();

router.post('/generate-quiz', generateQuiz);
router.post('/generate-interview-questions', generateInterviewQuestions);
router.post('/generate-visualization', generateVisualization);
router.post('/generate-theory', generateTheory);
router.post('/generate-tags', generateTags);

module.exports = router;
