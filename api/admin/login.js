// This file is now a pure API route for admin login, no DB or external dependencies

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admintoken2025';

export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      console.warn(`Invalid method: ${req.method} on /api/admin/login`); // Log invalid method
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed. Only POST is supported for admin login.` });
    }
    let body = req.body;
    // Vercel sometimes does not parse body automatically
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { username, password } = body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.status(200).json({ token: ADMIN_TOKEN });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Admin login server error:', err); // Log server error
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
