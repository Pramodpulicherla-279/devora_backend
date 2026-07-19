/**
 * One-time migration — add quizStats: { correct: 0, total: 0 }
 * to all existing users who don't have the field yet.
 *
 * Run once from the devora_backend directory:
 *   node scripts/addQuizStats.js
 */

'use strict';
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/devora';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);

    const collection = mongoose.connection.collection('users');

    const before = await collection.countDocuments({ quizStats: { $exists: false } });
    console.log(`\nUsers missing quizStats: ${before}`);

    if (before === 0) {
        console.log('✅  Nothing to migrate — all users already have quizStats.');
    } else {
        const result = await collection.updateMany(
            { quizStats: { $exists: false } },
            { $set: { quizStats: { correct: 0, total: 0 } } }
        );
        console.log(`✅  Updated ${result.modifiedCount} user(s).`);
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
}

main().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
