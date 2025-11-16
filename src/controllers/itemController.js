const Item = require('../models/Item');

// @desc    Get all items
// @route   GET /api/items
exports.getItems = async (req, res, next) => {
    try {
        const items = await Item.find();
        res.status(200).json({ success: true, data: items });
        console.log('called get all items api')
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

// @desc    Create new item
// @route   POST /api/items
exports.createItem = async (req, res, next) => {
    try {
        const item = await Item.create(req.body);
        res.status(201).json({
            success: true,
            data: item,
        });
        console.log('called create item api')

    } catch (err) {
        res.status(400).json({ success: false });
    }
};