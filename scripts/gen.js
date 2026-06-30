// Generate static HTML report for Lễ Tân Viola
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'report');
const OUT  = path.join(__dirname, '..', 'report');

const PERIOD   = process.argv[2] || thangHienTai();
const GEN_TIME = new Date().toLocaleString('vi-VN');

function thangHienTai() {
  const d = new Date();
  return `Tháng ${d.getMonth()+1}/${d.getFullYear()}`;
}

// helpers
function esc(s) { return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmt(n) { return new Intl.NumberFormat('vi-VN').format(Math.round(n||0)); }
function getNum(v) { if(typeof v==='number') return v; if(typeof v==='string') return parseFloat(v.replace(/,/g,''))||0; return 0; }
function getText(v) {
  if(!v) return '';
  if(typeof v==='string') return v;
  if(Array.isArray(v)) return v.map(x=>x.text||x.name||x.display_value||x.value||'').filter(Boolean).join(', ');
  if(typeof v==='object') return v.text||v.name||v.display_value||v.value||'';
  return String(v);
}
function getDate(v) {
  if(!v) return null;
  const d = new Date(typeof v==='number'?v:v);
  return isNaN(d)?null:d;
}
function fmtDate(v) {
  const d = getDate(v); if(!d) return '';
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function getMonth(v) {
  const d = getDate(v); if(!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

// Load data
const doanhthu = JSON.parse(fs.readFileSync(path.join(DATA,'data_doanhthu.json')));
const chi      = JSON.parse(fs.readFileSync(path.join(DATA,'data_chi.json')));
const sale     = JSON.parse(fs.readFileSync(path.join(DATA,'data_sale.json')));

// Parse period filter: "Tháng 6/2026" -> "2026-06"
function periodToYM(p) {
  const m = p.match(/(\d+)\/(\d+)/);
  if(!m) return null;
  return `${m[2]}-${String(parseInt(m[1])).padStart(2,'0')}`;
}
const filterYM = periodToYM(PERIOD);

function filterByMonth(rows, getTs) {
  if(!filterYM) return rows;
  return rows.filter(r => getMonth(getTs(r)) === filterYM);
}

const dtF  = filterByMonth(doanhthu, r => r['Ngày']);
const chiF = filterByMonth(chi,      r => r['Ngày']);
const slF  = filterByMonth(sale,     r => r['Ngày Tạo Đầu Tiên']);

// Tổng hợp doanh thu
function tongThu(r) { return getNum(r['Tiền mặt'])+getNum(r['Chuyển khoản'])+getNum(r['Quẹt thẻ'])+getNum(r['Trả góp']); }
const totalThu     = dtF.reduce((s,r)=>s+tongThu(r),0);
const totalTienMat = dtF.reduce((s,r)=>s+getNum(r['Tiền mặt']),0);
const totalCK      = dtF.reduce((s,r)=>s+getNum(r['Chuyển khoản']),0);
const totalThe     = dtF.reduce((s,r)=>s+getNum(r['Quẹt thẻ']),0);
const totalGop     = dtF.reduce((s,r)=>s+getNum(r['Trả góp']),0);
const totalGiam    = dtF.reduce((s,r)=>s+getNum(r['Số tiền giảm']),0);
const totalChi     = chiF.reduce((s,r)=>s+getNum(r['SỐ TIỀN CHI']),0);
const canDoi       = totalThu - totalChi;

// Top tư vấn
const byTuvan = {};
dtF.forEach(r => {
  const k = getText(r['Người tư vấn'])||'Chưa có';
  byTuvan[k] = (byTuvan[k]||0) + tongThu(r);
});
const topTuvan = Object.entries(byTuvan).sort((a,b)=>b[1]-a[1]).slice(0,8);
const maxTV = topTuvan[0]?.[1]||1;

// Top dịch vụ
const byDv = {};
dtF.forEach(r => {
  const k = getText(r['Phân nhóm dịch vụ'])||getText(r['Dịch vụ'])||'Khác';
  byDv[k] = (byDv[k]||0) + tongThu(r);
});
const topDv = Object.entries(byDv).sort((a,b)=>b[1]-a[1]).slice(0,6);

// Sale: trạng thái
const byTT = {};
slF.forEach(r => { const k=getText(r['Trạng Thái'])||'Chưa xác định'; byTT[k]=(byTT[k]||0)+1; });
const topTT = Object.entries(byTT).sort((a,b)=>b[1]-a[1]);

// Sale: theo nhân viên
const bySP = {};
slF.forEach(r => { const k=getText(r['Sale phone'])||'Chưa phân công'; bySP[k]=(bySP[k]||0)+1; });
const topSP = Object.entries(bySP).sort((a,b)=>b[1]-a[1]).slice(0,8);
const maxSP = topSP[0]?.[1]||1;

// Chi: theo mục đích
const byMD = {};
chiF.forEach(r => { const k=getText(r['MỤC ĐÍCH CHI'])||'Khác'; byMD[k]=(byMD[k]||0)+getNum(r['SỐ TIỀN CHI']); });
const topMD = Object.entries(byMD).sort((a,b)=>b[1]-a[1]).slice(0,6);
const maxMD = topMD[0]?.[1]||1;

// Effects (copy từ bao cao kh tu dong)
const DOTS = [[10,34,3,0],[84,26,2,2.4],[64,66,2.5,4],[27,74,2,1.2],[47,20,1.6,3],[92,58,2.2,5.5]]
  .map(([l,t,s,d])=>`<span class="dot" style="left:${l}%;top:${t}%;width:${s}px;height:${s}px;animation-delay:${d}s"></span>`).join('');
const FX = `<div class="fx fx-grid"></div><div class="fx fx-aurora"></div><div class="fx fx-glow"></div><div class="fx-sheen"></div>${DOTS}`;

function kpiBar(label, value, max, color) {
  const pct = max>0 ? Math.min(100, Math.round(value/max*100)) : 0;
  return `<div class="kpi-row">
    <div class="kpi-name">${esc(label)}</div>
    <div class="kpi-track"><div class="kpi-fill" style="width:${pct}%;background:${color}"></div></div>
    <div class="kpi-val">${fmt(value)} đ</div>
  </div>`;
}

function donut(tm, ck, the, gop) {
  const total = tm+ck+the+gop;
  if(!total) return '<div class="donut-empty">Chưa có dữ liệu</div>';
  const a = tm/total*360, b=a+ck/total*360, c=b+the/total*360;
  return `<div class="donut" style="background:conic-gradient(#16a34a 0 ${a}deg,#2563eb ${a}deg ${b}deg,#c8a951 ${b}deg ${c}deg,#9333ea ${c}deg 360deg)">
    <div class="donut-hole"><div class="donut-num">${fmt(Math.round(total/1000000))}M</div><div class="donut-lbl">đồng</div></div>
  </div>
  <div class="legend">
    <span><i style="background:#16a34a"></i>Tiền mặt ${fmt(tm)} đ</span>
    <span><i style="background:#2563eb"></i>Chuyển khoản ${fmt(ck)} đ</span>
    <span><i style="background:#c8a951"></i>Quẹt thẻ ${fmt(the)} đ</span>
    <span><i style="background:#9333ea"></i>Trả góp ${fmt(gop)} đ</span>
  </div>`;
}

// Chi table rows (top 20)
const chiRows = chiF.sort((a,b)=>(getDate(b['Ngày'])||0)-(getDate(a['Ngày'])||0)).slice(0,20).map(r=>`<tr>
  <td>${fmtDate(r['Ngày'])}</td>
  <td>${esc(getText(r['NỘI DUNG CHI']))}</td>
  <td>${esc(getText(r['BP THANH TOÁN']))}</td>
  <td>${esc(getText(r['MỤC ĐÍCH CHI']))}</td>
  <td style="text-align:right;color:#dc2626;font-weight:600">${fmt(getNum(r['SỐ TIỀN CHI']))}</td>
  <td style="color:#6b7280;font-size:12px">${esc(getText(r['GHI CHÚ']))}</td>
</tr>`).join('');

// DT table rows (top 20)
const dtRows = dtF.sort((a,b)=>(getDate(b['Ngày'])||0)-(getDate(a['Ngày'])||0)).slice(0,20).map(r=>`<tr>
  <td>${fmtDate(r['Ngày'])}</td>
  <td>${esc(getText(r['Tên KH']))}</td>
  <td>${esc(getText(r['Phân nhóm dịch vụ'])||getText(r['Dịch vụ']))}</td>
  <td>${esc(getText(r['Người tư vấn']))}</td>
  <td style="text-align:right">${fmt(getNum(r['Tiền mặt']))}</td>
  <td style="text-align:right">${fmt(getNum(r['Chuyển khoản']))}</td>
  <td style="text-align:right;color:#16a34a;font-weight:600">${fmt(tongThu(r))}</td>
</tr>`).join('');

// Sale table rows (top 20)
const STATUS_COLOR={'Đã đến':['#16a34a'],'Đã tư vấn':['#2563eb'],'Chưa liên hệ được':['#9333ea'],'Hủy':['#9ca3af']};
const slRows = slF.sort((a,b)=>(getDate(b['Ngày Tạo Đầu Tiên'])||0)-(getDate(a['Ngày Tạo Đầu Tiên'])||0)).slice(0,20).map(r=>{
  const tt = getText(r['Trạng Thái']);
  const color = STATUS_COLOR[tt]?.[0]||'#6b7280';
  return `<tr>
    <td>${fmtDate(r['Ngày Tạo Đầu Tiên'])}</td>
    <td>${esc(getText(r['Tên Kh']))}</td>
    <td><span class="bdg" style="background:${color}">${esc(tt)}</span></td>
    <td>${esc(getText(r['NGUỒN']))}</td>
    <td>${esc(getText(r['PHÂN LOẠI SALE']))}</td>
    <td>${esc(getText(r['Sale phone']))}</td>
    <td>${esc(getText(r['Tư vấn']))}</td>
  </tr>`;
}).join('');

const CSS = fs.readFileSync(path.join(__dirname,'..','web','style.css'),'utf8');

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Báo Cáo Lễ Tân • ${esc(PERIOD)}</title>
<style>${CSS}
.kpi-val{font-size:12px}
.section-tabs{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap}
.tab-btn{padding:7px 18px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:13px;cursor:pointer;font-family:inherit;color:var(--ink)}
.tab-btn.active{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1205;font-weight:700;border-color:transparent}
.tab-panel{display:none}.tab-panel.active{display:block}
</style>
</head><body><div class="wrap">

<!-- HERO -->
<div class="card hero">
  ${FX}
  <div class="hero-in">
    <div class="hero-doc">Báo cáo bộ phận lễ tân</div>
    <h1>Viola Clinic</h1>
    <div class="sub">Tổng hợp thu chi · doanh thu · sale phone / khách</div>
    <div>
      <span class="badge-period">📅 ${esc(PERIOD)}</span>
      <span class="badge-period">🔄 Cập nhật: ${esc(GEN_TIME)}</span>
    </div>
  </div>
</div>

<!-- TỔNG QUAN -->
<div class="card">
  <h2>📊 Tổng quan tháng</h2>
  <div class="stat-grid">
    <div class="stat"><div class="v" style="color:#16a34a">${fmt(totalThu)}</div><div class="l">Tổng thu (đ)</div></div>
    <div class="stat"><div class="v" style="color:#dc2626">${fmt(totalChi)}</div><div class="l">Tổng chi (đ)</div></div>
    <div class="stat"><div class="v" style="color:${canDoi>=0?'#16a34a':'#dc2626'}">${fmt(canDoi)}</div><div class="l">Cân đối (đ)</div></div>
    <div class="stat"><div class="v" style="color:#2563eb">${dtF.length}</div><div class="l">Số đơn hàng</div></div>
    <div class="stat"><div class="v" style="color:#c8a951">${fmt(totalGiam)}</div><div class="l">Tổng giảm giá (đ)</div></div>
    <div class="stat"><div class="v">${dtF.length?fmt(totalThu/dtF.length):0}</div><div class="l">Trung bình / đơn (đ)</div></div>
    <div class="stat"><div class="v" style="color:#9333ea">${slF.length}</div><div class="l">Khách sale</div></div>
    <div class="stat"><div class="v">${chiF.length}</div><div class="l">Khoản chi</div></div>
  </div>
</div>

<!-- TABS -->
<div class="section-tabs">
  <button class="tab-btn active" onclick="switchTab('thuchi')">💵 Thu Chi</button>
  <button class="tab-btn" onclick="switchTab('doanhthu')">📈 Doanh Thu</button>
  <button class="tab-btn" onclick="switchTab('sale')">📞 Sale Phone / Khách</button>
</div>

<!-- TAB: THU CHI -->
<div class="tab-panel active" id="tab-thuchi">
  <div class="card">
    <h2>💵 Cơ cấu thu</h2>
    <div class="split">
      <div>
        ${kpiBar('Tiền mặt', totalTienMat, totalThu, '#16a34a')}
        ${kpiBar('Chuyển khoản', totalCK, totalThu, '#2563eb')}
        ${kpiBar('Quẹt thẻ', totalThe, totalThu, '#c8a951')}
        ${kpiBar('Trả góp', totalGop, totalThu, '#9333ea')}
      </div>
      <div>${donut(totalTienMat, totalCK, totalThe, totalGop)}</div>
    </div>
  </div>

  <div class="card">
    <h2>🔴 Chi tiêu theo mục đích</h2>
    ${topMD.map(([k,v])=>kpiBar(k,v,maxMD,'#dc2626')).join('')}
  </div>

  <div class="card">
    <h2>🧾 Chi tiết khoản chi (20 gần nhất)</h2>
    <table><thead><tr><th>Ngày</th><th>Nội dung</th><th>Bộ phận</th><th>Mục đích</th><th style="text-align:right">Số tiền</th><th>Ghi chú</th></tr></thead>
    <tbody>${chiRows||'<tr><td colspan=6 class="muted">Chưa có dữ liệu</td></tr>'}</tbody></table>
  </div>
</div>

<!-- TAB: DOANH THU -->
<div class="tab-panel" id="tab-doanhthu">
  <div class="card">
    <h2>🎯 Doanh thu theo tư vấn</h2>
    ${topTuvan.map(([k,v])=>kpiBar(k,v,maxTV,'#16a34a')).join('')}
  </div>

  <div class="card">
    <h2>💊 Doanh thu theo dịch vụ</h2>
    ${topDv.map(([k,v])=>kpiBar(k,v,topDv[0]?.[1]||1,'#2563eb')).join('')}
  </div>

  <div class="card">
    <h2>🧾 Chi tiết đơn hàng (20 gần nhất)</h2>
    <table><thead><tr><th>Ngày</th><th>Tên KH</th><th>Dịch vụ</th><th>Tư vấn</th><th style="text-align:right">Tiền mặt</th><th style="text-align:right">CK</th><th style="text-align:right">Tổng</th></tr></thead>
    <tbody>${dtRows||'<tr><td colspan=7 class="muted">Chưa có dữ liệu</td></tr>'}</tbody></table>
  </div>
</div>

<!-- TAB: SALE -->
<div class="tab-panel" id="tab-sale">
  <div class="card">
    <h2>📞 Sale phone theo nhân viên</h2>
    ${topSP.map(([k,v])=>kpiBar(k,v,maxSP,'#c8a951')).join('')}
  </div>

  <div class="card">
    <h2>📋 Trạng thái khách hàng</h2>
    <div class="stat-grid">
      ${topTT.slice(0,8).map(([k,v])=>`<div class="stat"><div class="v">${v}</div><div class="l">${esc(k)}</div></div>`).join('')}
    </div>
  </div>

  <div class="card">
    <h2>👥 Danh sách khách (20 gần nhất)</h2>
    <table><thead><tr><th>Ngày</th><th>Tên KH</th><th>Trạng thái</th><th>Nguồn</th><th>Phân loại</th><th>Sale phone</th><th>Tư vấn</th></tr></thead>
    <tbody>${slRows||'<tr><td colspan=7 class="muted">Chưa có dữ liệu</td></tr>'}</tbody></table>
  </div>
</div>

<!-- FOOTER -->
<div class="foot">
  ${FX}
  <div class="foot-in">
    <div class="ftag">Báo cáo nội bộ · Viola Clinic</div>
    <div class="fc">Bộ phận Lễ Tân - Tư Vấn<br>Số liệu cập nhật: <b>${esc(GEN_TIME)}</b></div>
  </div>
</div>
<div class="gen">Kỳ báo cáo: ${esc(PERIOD)}</div>
</div>

<div class="fab">
  <button class="btn gold" onclick="location.reload()">🔄 Cập nhật</button>
  <button class="btn" onclick="window.print()">🖨 In / PDF</button>
</div>

<script>
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  event.target.classList.add('active');
}
</script>
</body></html>`;

fs.writeFileSync(path.join(OUT,'index.html'), html);
console.log(`✓ Đã tạo report/index.html — ${esc(PERIOD)}`);
