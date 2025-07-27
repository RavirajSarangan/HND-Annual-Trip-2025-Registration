// Diagnostic script for MongoDB Atlas permissions and collection access
// Usage: node server/check_permissions.cjs

const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://venomstudio29:Sarangan132@cluster0.09dyfh9.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'test';
const collectionName = 'registrations';

async function checkPermissions() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    // Try to insert, update, and delete a test document
    const testDoc = { fullname: 'Test User', reg_number: '000', contact_number: '000', course: 'Test', createdAt: new Date() };
    const insertResult = await collection.insertOne(testDoc);
    console.log('Insert success:', insertResult.insertedId);
    const updateResult = await collection.updateOne({ _id: insertResult.insertedId }, { $set: { fullname: 'Test User Updated' } });
    console.log('Update success:', updateResult.modifiedCount);
    const deleteResult = await collection.deleteOne({ _id: insertResult.insertedId });
    console.log('Delete success:', deleteResult.deletedCount);
    console.log('All permissions OK.');
  } catch (err) {
    console.error('Permission or connection error:', err);
  } finally {
    await client.close();
  }
}

checkPermissions();
