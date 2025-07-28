// Migration script to ensure all registration documents have valid ObjectId _id fields
// Usage: node migrate_registrations.cjs

const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://venomstudio29:Sarangan132@cluster0.09dyfh9.mongodb.net/test?retryWrites=true&w=majority'; // Update if your MongoDB URI is different
const dbName = 'test'; // Update to your actual database name
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
      // If _id is missing, not an ObjectId, or is a string, fix it
      if (!doc._id || typeof doc._id !== 'object' || !ObjectId.isValid(doc._id)) {
        const { _id, ...rest } = doc;
        await collection.deleteOne({ _id: doc._id });
        await collection.insertOne({ ...rest, _id: new ObjectId() });
        updated++;
      } else if (typeof doc._id === 'string' && ObjectId.isValid(doc._id)) {
        // If _id is a string but valid ObjectId, convert to ObjectId
        const { _id, ...rest } = doc;
        await collection.deleteOne({ _id: doc._id });
        await collection.insertOne({ ...rest, _id: new ObjectId(doc._id) });
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
