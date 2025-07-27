import mongoose from 'mongoose';

// Enable CORS for serverless function
export const config = {
  api: {
    bodyParser: true,
  },
};

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  try {
    await dbConnect();
  } catch (err) {
    return res.status(500).json({ error: 'MongoDB connection failed', details: err.message });
  }
  if (req.method === 'POST') {
    try {
      const reg = await Registration.create(req.body);
      return res.status(201).json(reg);
    } catch (err) {
      return res.status(500).json({ error: 'Registration failed', details: err.message });
    }
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
