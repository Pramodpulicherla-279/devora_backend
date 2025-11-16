const express = require('express');
const {
    getItems,
    createItem,
} = require('../controllers/itemController');

const router = express.Router();

router.route('/').get(getItems).post(createItem);

module.exports = router;