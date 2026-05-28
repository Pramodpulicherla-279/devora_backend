/**
 * One-time migration — drop the old (user, lesson) unique index
 * from the userlessonprogresses collection.
 *
 * That index was created before track-scoped progress was added.
 * It now blocks upserts when the same lesson is completed inside
 * a different track, because MongoDB sees a duplicate (user, lesson)
 * pair even though trackSlug differs.
 *
 * Run once from the devora_backend directory:
 *   node scripts/dropOldProgressIndex.js
 */

'use strict';
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/devora';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);

    const collection = mongoose.connection.collection('userlessonprogresses');
    const indexes = await collection.indexes();

    console.log('\nExisting indexes:');
    indexes.forEach(idx => console.log(' ', idx.name, '->', JSON.stringify(idx.key)));

    // Find the old 2-field index: { user: 1, lesson: 1 } — no trackSlug
    const oldIndex = indexes.find(idx => {
        const keys = Object.keys(idx.key);
        return (
            keys.length === 2 &&
            keys.includes('user') &&
            keys.includes('lesson') &&
            !keys.includes('trackSlug')
        );
    });

    if (!oldIndex) {
        console.log('\n✅  Old index "user_1_lesson_1" not found — already dropped or never existed.');
    } else {
        console.log(`\nDropping old index: "${oldIndex.name}"…`);
        await collection.dropIndex(oldIndex.name);
        console.log('✅  Done. The new (user, lesson, trackSlug) unique index will now work correctly.');
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
}

main().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
