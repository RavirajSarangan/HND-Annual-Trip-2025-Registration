import mongoose from 'mongoose';

// --- Mongoose connection cache ---
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// --- Registration model ---
const RegistrationSchema = new mongoose.Schema({
  fullname: String,
  reg_number: String,
  course: String,
  contact_number: String,
  createdAt: { type: Date, default: Date.now }
});
const Registration = mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);

export default async function handler(req, res) {
  await dbConnect();
  const { method } = req;
  if (method === 'GET') {
    const regs = await Registration.find().sort({ createdAt: -1 });
    return res.status(200).json(regs);
  }
  if (method === 'POST') {
    const reg = await Registration.create(req.body);
    return res.status(201).json(reg);
  }
  if (method === 'PUT') {
    const { id } = req.query;
    const updated = await Registration.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Registration not found.' });
    return res.status(200).json(updated);
  }
  if (method === 'DELETE') {
    const { id } = req.query;
    const deleted = await Registration.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Registration not found.' });
    return res.status(200).json({ message: 'Deleted' });
  }
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
