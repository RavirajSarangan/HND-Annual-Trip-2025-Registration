import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yourdbname';
console.log('Connecting to MongoDB:', mongoUri);

// Remove deprecated options from mongoose.connect
mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err.message);
});

const registrationSchema = new mongoose.Schema({
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

const Registration = mongoose.model('Registration', registrationSchema);

app.post('/api/register', async (req, res) => {
  try {
    // Only allow real data, not test/demo data
    if (
      req.body.fullname &&
      req.body.fullname.toLowerCase().includes('test')
    ) {
      return res.status(400).json({ error: 'Test/demo data is not allowed.' });
    }
    const registration = new Registration(req.body);
    await registration.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// --- Admin Auth (simple demo, not for production) ---
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
let ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admintoken2025';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ token: ADMIN_TOKEN });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// --- Enhanced error logging for admin endpoints ---
function logAndSendError(res, error, msg, code = 500) {
  console.error(msg, error);
  res.status(code).json({ error: msg, details: error?.message || error });
}

// Health check with MongoDB URI
app.get('/api/health', (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'ok' : 'error',
    mongoUri: process.env.MONGODB_URI || mongoose.connection.client?.s?.url || 'not set',
    dbState: mongoose.connection.readyState
  });
});

app.get('/api/admin/registrations', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database not connected' });
  }
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const regs = await Registration.find().sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    logAndSendError(res, err, 'Failed to fetch registrations');
  }
});

// Delete registration
app.delete('/api/admin/registrations/:id', async (req, res) => {
  const auth = req.headers.authorization || '';
  console.log('DELETE /api/admin/registrations/:id', req.params.id, 'Auth:', auth);
  if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN) {
    console.log('Unauthorized delete attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (mongoose.connection.readyState !== 1) {
    console.error('Delete failed: MongoDB not connected');
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const deleted = await Registration.findByIdAndDelete(req.params.id);
    console.log('Delete result:', deleted);
    if (!deleted) {
      console.log('Delete failed: Not found', req.params.id);
      return res.status(404).json({ error: 'Registration not found or already deleted.' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ error: err.message || 'Delete failed', details: err });
  }
});

// Change admin password (demo: in-memory only)
app.post('/api/admin/change-password', (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { oldpass, newpass } = req.body;
  if (oldpass !== ADMIN_PASS) {
    return res.status(400).json({ error: 'Current password incorrect' });
  }
  ADMIN_PASS = newpass;
  res.json({ message: 'Password changed successfully' });
});

// Edit registration
app.put('/api/admin/registrations/:id', async (req, res) => {
  const auth = req.headers.authorization || '';
  console.log('PUT /api/admin/registrations/:id', req.params.id, 'Auth:', auth, 'Body:', req.body);
  if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN) {
    console.log('Unauthorized edit attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (mongoose.connection.readyState !== 1) {
    console.error('Edit failed: MongoDB not connected');
    return res.status(500).json({ error: 'Database not connected' });
  }
  try {
    const updated = await Registration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    console.log('Edit result:', updated);
    if (!updated) {
      console.log('Edit failed: Not found', req.params.id);
      return res.status(404).json({ error: 'Registration not found.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Edit error:', err);
    return res.status(500).json({ error: err.message || 'Update failed', details: err });
  }
});

// --- Admin Users (DB-based, demo) ---
const adminUserSchema = new mongoose.Schema({
  username: String,
  password: String
});
const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

// Add admin user
app.post('/api/admin/add', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const exists = await AdminUser.findOne({ username });
  if (exists) return res.status(400).json({ error: 'User exists' });
  await AdminUser.create({ username, password });
  res.json({ message: 'Admin added' });
});

// Export registrations as CSV
app.get('/api/admin/export', async (req, res) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const regs = await Registration.find().sort({ createdAt: -1 });
  if (!regs.length) return res.status(404).send('No data');
  const fields = Object.keys(regs[0].toObject()).filter(f => f !== '__v');
  const csv = [fields.join(',')].concat(regs.map(r => fields.map(f => '"'+(r[f]||'')+'"').join(','))).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
  res.send(csv);
});

// Auto-update endpoint for server health and environment debug
app.get('/api/debug/env', (req, res) => {
  res.json({
    ADMIN_USER: process.env.ADMIN_USER,
    ADMIN_PASS: process.env.ADMIN_PASS ? '***' : undefined,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'not set',
    NODE_ENV: process.env.NODE_ENV,
    dbState: mongoose.connection.readyState
  });
});

// Global error handler for uncaught errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
