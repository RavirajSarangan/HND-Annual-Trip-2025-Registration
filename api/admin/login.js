// This file is now a pure API route for admin login, no DB or external dependencies

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admintoken2025';

export default function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'POST') {
      console.warn(`Invalid method: ${req.method} on /api/admin/login`);
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed. Only POST is supported for admin login.` });
    }
    let body = req.body;
    // Ensure body is parsed if it's a string
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('Body parsing failed:', e);
        return res.status(400).json({ error: 'Invalid request body format' });
      }
    }
    if (!body || typeof body !== 'object') {
      console.error('Request body missing or not an object:', body);
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }
    const { username, password } = body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.status(200).json({ token: ADMIN_TOKEN });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error('Admin login server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
