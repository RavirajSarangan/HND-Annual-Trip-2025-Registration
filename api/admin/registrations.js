import mongoose from 'mongoose';

// Enable CORS for serverless function
export const config = {
  api: {
    bodyParser: true,
  },
};

// --- Mongoose connection cache ---
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
async function dbConnect() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// --- Registration model ---
const RegistrationSchema = new mongoose.Schema({
  participation_interest: String,
  fullname: String,
  reg_number: String,
  nic_number: String,
  contact_number: String,
  course: String,
  batch_number: String,
  medical_issues: String,
  medical_details: String,
  emergency_contact: String,
  terms: String,
  createdAt: { type: Date, default: Date.now }
});
const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  try {
    await dbConnect();
  } catch (err) {
    return res.status(500).json({ error: 'MongoDB connection failed', details: err.message });
  }
  const { method } = req;
  try {
    if (method === 'GET') {
      const regs = await Registration.find().sort({ createdAt: -1 });
      return res.status(200).json(regs);
    }
    if (method === 'POST') {
      const reg = await Registration.create(req.body);
      return res.status(201).json(reg);
    }
    if (method === 'PUT' || method === 'DELETE') {
      let id = req.query.id;
      if (!id) {
        const urlNoQuery = req.url.split('?')[0];
        const parts = urlNoQuery.split('/');
        id = parts[parts.length - 1];
      }
      if (!id) return res.status(400).json({ error: 'Missing registration id.', id });
      try {
        let result;
        if (method === 'PUT') {
          result = await Registration.findOneAndUpdate({ _id: id }, req.body, { new: true });
          if (!result) {
            result = await Registration.findOneAndUpdate({ reg_number: id }, req.body, { new: true });
          }
          if (!result) {
            result = await Registration.findOneAndUpdate({ fullname: id }, req.body, { new: true });
          }
          if (!result) {
            result = await Registration.findOneAndUpdate({ contact_number: id }, req.body, { new: true });
          }
          console.log('PUT id:', id, 'Update result:', result);
          if (!result) return res.status(404).json({ error: 'Registration not found.', id });
          return res.status(200).json(result);
        }
        if (method === 'DELETE') {
          result = await Registration.findOneAndDelete({ _id: id });
          if (!result) {
            result = await Registration.findOneAndDelete({ reg_number: id });
          }
          if (!result) {
            result = await Registration.findOneAndDelete({ fullname: id });
          }
          if (!result) {
            result = await Registration.findOneAndDelete({ contact_number: id });
          }
          console.log('DELETE id:', id, 'Delete result:', result);
          if (!result) return res.status(404).json({ error: 'Registration not found.', id });
          return res.status(200).json({ message: 'Deleted', id });
        }
      } catch (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message, id });
      }
    }
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    return res.status(500).json({ error: 'Request failed', details: err.message });
  }
}
