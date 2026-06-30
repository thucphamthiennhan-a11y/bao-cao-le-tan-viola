// Fetch data from Lark Base and save to report/data_*.json
import 'dotenv/config';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'report');

const APP_ID     = process.env.LARK_APP_ID;
const APP_SECRET = process.env.LARK_APP_SECRET;
const BASE_ID    = process.env.LARK_BASE_ID;
const TBL_SALE   = process.env.TABLE_SALE;
const TBL_DT     = process.env.TABLE_DOANHTHU;
const TBL_CHI    = process.env.TABLE_CHI;

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getToken() {
  const res = await request({
    hostname: 'open.larksuite.com',
    path: '/open-apis/auth/v3/tenant_access_token/internal',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { app_id: APP_ID, app_secret: APP_SECRET });
  return res.tenant_access_token;
}

async function fetchTable(token, tableId, fields) {
  const all = [];
  let pageToken = '';
  do {
    const qs = new URLSearchParams({ page_size: '500' });
    if (fields) qs.set('field_names', JSON.stringify(fields));
    if (pageToken) qs.set('page_token', pageToken);

    const res = await request({
      hostname: 'open.larksuite.com',
      path: `/open-apis/bitable/v1/apps/${BASE_ID}/tables/${tableId}/records?${qs}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    const items = res.data?.items || [];
    items.forEach(r => all.push(r.fields));
    pageToken = res.data?.has_more ? res.data.page_token : '';
  } while (pageToken);
  return all;
}

async function main() {
  console.log('Lấy token...');
  const token = await getToken();

  console.log('Fetch doanh thu...');
  const doanhthu = await fetchTable(token, TBL_DT, [
    'Ngày','Tên KH','Dịch vụ','Phân nhóm dịch vụ','Bộ Phận',
    'Người tư vấn','Nguồn','Phân loại Kh',
    'Tiền mặt','Chuyển khoản','Quẹt thẻ','Trả góp','Số tiền giảm'
  ]);

  console.log('Fetch chi...');
  const chi = await fetchTable(token, TBL_CHI, [
    'Ngày','NỘI DUNG CHI','BP THANH TOÁN','MỤC ĐÍCH CHI','SỐ TIỀN CHI','GHI CHÚ'
  ]);

  console.log('Fetch sale...');
  const sale = await fetchTable(token, TBL_SALE, [
    'Tên Kh','Trạng Thái','NGUỒN','PHÂN LOẠI SALE',
    'Sale phone','Tư vấn','Dv quan tâm','Ngày Tạo Đầu Tiên'
  ]);

  fs.writeFileSync(path.join(OUT, 'data_doanhthu.json'), JSON.stringify(doanhthu));
  fs.writeFileSync(path.join(OUT, 'data_chi.json'), JSON.stringify(chi));
  fs.writeFileSync(path.join(OUT, 'data_sale.json'), JSON.stringify(sale));

  console.log(`✓ Doanh thu: ${doanhthu.length} | Chi: ${chi.length} | Sale: ${sale.length}`);
}

main().catch(console.error);
