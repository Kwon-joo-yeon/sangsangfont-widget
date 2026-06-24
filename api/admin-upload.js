import { put, list, del } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

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

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from('--' + boundary);
  let start = buffer.indexOf(boundaryBuf) + boundaryBuf.length + 2;

  while (start < buffer.length) {
    const end = buffer.indexOf(boundaryBuf, start);
    if (end === -1) break;
    const part = buffer.slice(start, end - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = end + boundaryBuf.length + 2; continue; }
    const headers = part.slice(0, headerEnd).toString();
    const body = part.slice(headerEnd + 4);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const fileMatch = headers.match(/filename="([^"]+)"/);
    const typeMatch = headers.match(/Content-Type:\s*(.+)/i);
    parts.push({
      name: nameMatch ? nameMatch[1] : '',
      filename: fileMatch ? fileMatch[1] : null,
      contentType: typeMatch ? typeMatch[1].trim() : 'application/octet-stream',
      data: body
    });
    start = end + boundaryBuf.length + 2;
  }
  return parts;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = getToken(req);
  const valid = await verifyToken(token);
  if (!valid) return res.status(401).json({ error: "인증 필요" });

  if (req.method === "GET") {
    const { type } = req.query;
    const prefix = type === 'font' ? 'fonts/' : 'images/';
    try {
      const result = await list({ prefix });
      return res.status(200).json({ files: result.blobs });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "url 필요" });
    try {
      await del(url);
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) return res.status(400).json({ error: "multipart 형식 필요" });

      const parts = parseMultipart(buffer, boundary);
      const typePart = parts.find(p => p.name === 'type');
      const filePart = parts.find(p => p.filename);
      if (!filePart) return res.status(400).json({ error: "파일이 없습니다" });

      const uploadType = typePart ? typePart.data.toString().trim() : 'font';
      const prefix = uploadType === 'font' ? 'fonts/' : 'images/';
      const pathname = prefix + filePart.filename;

      const blob = await put(pathname, filePart.data, {
        access: 'public',
        contentType: filePart.contentType,
        addRandomSuffix: false
      });

      return res.status(200).json({ url: blob.url, pathname: blob.pathname });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "허용되지 않는 메소드" });
}
