import { put, head } from '@vercel/blob';

function getToken(req) {
  return (req.headers.authorization || '').replace('Bearer ', '');
}

async function verifyToken(token) {
  if (!token) return false;
  try {
    const res = await fetch(`https://${process.env.VERCEL_URL}/api/admin-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token })
    });
    const data = await res.json();
    return data.valid === true;
  } catch { return false; }
}

const CONFIG_PATH = 'config/font-overrides.json';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET은 인증 없이 (프론트에서 폰트 설정 로드용)
  if (req.method === "GET") {
    try {
      const info = await head(CONFIG_PATH);
      const resp = await fetch(info.url);
      const data = await resp.json();
      return res.status(200).json(data);
    } catch {
      return res.status(200).json({ fontOverrides: {}, templateImages: {} });
    }
  }

  // POST는 인증 필요
  if (req.method === "POST") {
    const token = getToken(req);
    const valid = await verifyToken(token);
    if (!valid) return res.status(401).json({ error: "인증 필요" });

    try {
      const config = req.body;
      await put(CONFIG_PATH, JSON.stringify(config), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "허용되지 않는 메소드" });
}
