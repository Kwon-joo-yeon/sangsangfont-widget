import { createHash, randomBytes } from 'crypto';

const tokens = new Map();

function hashPassword(pw) {
  return createHash('sha256').update(pw).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const { action, password, token } = req.body;

  if (action === "login") {
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw) return res.status(500).json({ error: "관리자 비밀번호 미설정" });
    if (hashPassword(password) !== hashPassword(adminPw)) {
      return res.status(401).json({ error: "비밀번호가 틀렸습니다" });
    }
    const newToken = randomBytes(32).toString('hex');
    tokens.set(newToken, Date.now() + 3600000);
    return res.status(200).json({ token: newToken });
  }

  if (action === "verify") {
    const expiry = tokens.get(token);
    if (!expiry || Date.now() > expiry) {
      tokens.delete(token);
      return res.status(401).json({ error: "세션 만료" });
    }
    return res.status(200).json({ valid: true });
  }

  return res.status(400).json({ error: "잘못된 요청" });
}
