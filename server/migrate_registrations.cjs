// Migration script to ensure all registration documents have valid ObjectId _id fields
// Usage: node migrate_registrations.cjs

const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017'; // Update if your MongoDB URI is different
const dbName = 'your_db_name'; // Update to your actual database name
const collectionName = 'registrations'; // Update if your collection name is different

async function migrate() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const docs = await collection.find({}).toArray();
    let updated = 0;
    for (const doc of docs) {
      if (!doc._id || typeof doc._id !== 'object' || !ObjectId.isValid(doc._id)) {
        // Remove old _id if present and insert with new ObjectId
        const { _id, ...rest } = doc;
        await collection.deleteOne({ _id: doc._id });
        await collection.insertOne({ ...rest, _id: new ObjectId() });
        updated++;
      }
    }
    console.log(`Migration complete. Updated ${updated} documents.`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.close();
  }
}

migrate();
