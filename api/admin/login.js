// This file is now a pure API route for admin login, no DB or external dependencies

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admintoken2025';

export default function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    let body = req.body;
    // Debug: log incoming body and env
    console.log('ADMIN_USER:', ADMIN_USER, 'ADMIN_PASS:', ADMIN_PASS, 'ADMIN_TOKEN:', ADMIN_TOKEN);
    console.log('Received body:', body);
    // Vercel sometimes does not parse body automatically
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { console.error('Body parse error:', e); }
    }
    const { username, password } = body || {};
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      console.log('Login success');
      return res.status(200).json({ token: ADMIN_TOKEN });
    }
    console.log('Invalid credentials');
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
