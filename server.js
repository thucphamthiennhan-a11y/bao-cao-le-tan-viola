import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const LARK_API = 'https://open.larksuite.com/open-apis';
let cachedToken = null;
let tokenExpiry = 0;

async function getTenantToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await axios.post(`${LARK_API}/auth/v3/tenant_access_token/internal`, {
    app_id: process.env.LARK_APP_ID,
    app_secret: process.env.LARK_APP_SECRET,
  });
  cachedToken = res.data.tenant_access_token;
  tokenExpiry = Date.now() + (res.data.expire - 60) * 1000;
  return cachedToken;
}

async function fetchAllRecords(tableId, fields) {
  const token = await getTenantToken();
  const baseId = process.env.LARK_BASE_ID;
  let records = [];
  let pageToken = null;

  do {
    const params = { page_size: 500 };
    if (fields) params.field_names = JSON.stringify(fields);
    if (pageToken) params.page_token = pageToken;

    const res = await axios.get(
      `${LARK_API}/bitable/v1/apps/${baseId}/tables/${tableId}/records`,
      { headers: { Authorization: `Bearer ${token}` }, params }
    );
    records = records.concat(res.data.data.items || []);
    pageToken = res.data.data.has_more ? res.data.data.page_token : null;
  } while (pageToken);

  return records;
}

// API: Doanh thu
app.get('/api/doanhthu', async (req, res) => {
  try {
    const records = await fetchAllRecords(process.env.TABLE_DOANHTHU, [
      'Ngày', 'Tên KH', 'Dịch vụ', 'Phân nhóm dịch vụ', 'Bộ Phận',
      'Người tư vấn', 'Nguồn', 'Phân loại Kh',
      'Tiền mặt', 'Chuyển khoản', 'Quẹt thẻ', 'Trả góp',
      'Số tiền giảm', 'Thực thu', 'Công nợ', 'THÁNG', 'Năm'
    ]);
    res.json(records.map(r => r.fields));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Chi
app.get('/api/chi', async (req, res) => {
  try {
    const records = await fetchAllRecords(process.env.TABLE_CHI, [
      'Ngày', 'NỘI DUNG CHI', 'BP THANH TOÁN', 'MỤC ĐÍCH CHI',
      'SỐ TIỀN CHI', 'GHI CHÚ', 'Các mục mẹ', 'THÁNG CHI'
    ]);
    res.json(records.map(r => r.fields));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Sale phone/khách
app.get('/api/sale', async (req, res) => {
  try {
    const records = await fetchAllRecords(process.env.TABLE_SALE, [
      'Tên Kh', 'Trạng Thái', 'NGUỒN', 'PHÂN LOẠI SALE',
      'Sale phone', 'Tư vấn', 'Dv quan tâm', 'Ngày Tạo Đầu Tiên'
    ]);
    res.json(records.map(r => r.fields));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve React build
app.use(express.static(path.join(__dirname, 'dist')));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, 'dist/index.html')));

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3001;
app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));
