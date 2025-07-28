import mongoose from 'mongoose';

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

const RegistrationSchema = new mongoose.Schema({}, { strict: false });
const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    await dbConnect();
    const regs = await Registration.find().sort({ createdAt: -1 });
    if (!regs.length) return res.status(404).json({ error: 'No registrations found.' });
    // Convert to CSV
    const fields = Object.keys(regs[0].toObject()).filter(f => f !== '__v');
    const csvRows = [fields.join(',')];
    for (const reg of regs) {
      const row = fields.map(f => `"${(reg[f] || '').toString().replace(/"/g, '""')}"`).join(',');
      csvRows.push(row);
    }
    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    res.status(200).send(csv);
  } catch (err) {
    console.error('Export failed:', err);
    res.status(500).json({ error: 'Export failed', details: err.message });
  }
}
