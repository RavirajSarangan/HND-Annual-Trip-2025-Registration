import mongoose from 'mongoose';

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
  await dbConnect();
  if (req.method === 'POST') {
    try {
      const reg = await Registration.create(req.body);
      return res.status(201).json(reg);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
