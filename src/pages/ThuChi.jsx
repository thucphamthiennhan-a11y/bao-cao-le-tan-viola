import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { fmt, fmtDate, getNum, getText, getMonth, monthLabel } from '../utils';

const COLORS = ['#22a06b', '#e03e3e', '#0055cc', '#c8a951'];

export default function ThuChi({ filterMonth }) {
  const [doanhthu, setDoanhthu] = useState([]);
  const [chi, setChi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/doanhthu').then(r => r.data),
      axios.get('/api/chi').then(r => r.data),
    ]).then(([dt, c]) => {
      setDoanhthu(dt);
      setChi(c);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const dt = filterMonth
      ? doanhthu.filter(r => getMonth(r['Ngày']) === filterMonth)
      : doanhthu;
    const c = filterMonth
      ? chi.filter(r => getMonth(r['Ngày']) === filterMonth)
      : chi;
    return { dt, c };
  }, [doanhthu, chi, filterMonth]);

  const totalThu = useMemo(() =>
    filtered.dt.reduce((s, r) => s + getNum(r['Tiền mặt']) + getNum(r['Chuyển khoản']) + getNum(r['Quẹt thẻ']) + getNum(r['Trả góp']), 0)
  , [filtered]);

  const totalTienMat = useMemo(() =>
    filtered.dt.reduce((s, r) => s + getNum(r['Tiền mặt']), 0)
  , [filtered]);

  const totalChuyen = useMemo(() =>
    filtered.dt.reduce((s, r) => s + getNum(r['Chuyển khoản']), 0)
  , [filtered]);

  const totalChi = useMemo(() =>
    filtered.c.reduce((s, r) => s + getNum(r['SỐ TIỀN CHI']), 0)
  , [filtered]);

  const canDoi = totalThu - totalChi;

  // Chart: doanh thu theo ngày
  const byDay = useMemo(() => {
    const map = {};
    filtered.dt.forEach(r => {
      const d = fmtDate(r['Ngày']);
      if (!d) return;
      if (!map[d]) map[d] = { ngay: d, thu: 0, chi: 0 };
      map[d].thu += getNum(r['Tiền mặt']) + getNum(r['Chuyển khoản']) + getNum(r['Quẹt thẻ']) + getNum(r['Trả góp']);
    });
    filtered.c.forEach(r => {
      const d = fmtDate(r['Ngày']);
      if (!d) return;
      if (!map[d]) map[d] = { ngay: d, thu: 0, chi: 0 };
      map[d].chi += getNum(r['SỐ TIỀN CHI']);
    });
    return Object.values(map).sort((a, b) => a.ngay.localeCompare(b.ngay)).slice(-30);
  }, [filtered]);

  // Pie: cơ cấu thu
  const pieData = [
    { name: 'Tiền mặt', value: totalTienMat },
    { name: 'Chuyển khoản', value: totalChuyen },
    { name: 'Quẹt thẻ', value: filtered.dt.reduce((s, r) => s + getNum(r['Quẹt thẻ']), 0) },
    { name: 'Trả góp', value: filtered.dt.reduce((s, r) => s + getNum(r['Trả góp']), 0) },
  ].filter(d => d.value > 0);

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải dữ liệu...</div>;

  return (
    <>
      <div className="cards-grid">
        <div className="card">
          <div className="card-label">Tổng thu</div>
          <div className="card-value green">{fmt(totalThu)}</div>
          <div className="card-sub">đồng</div>
        </div>
        <div className="card">
          <div className="card-label">Tiền mặt</div>
          <div className="card-value blue">{fmt(totalTienMat)}</div>
          <div className="card-sub">đồng</div>
        </div>
        <div className="card">
          <div className="card-label">Chuyển khoản</div>
          <div className="card-value gold">{fmt(totalChuyen)}</div>
          <div className="card-sub">đồng</div>
        </div>
        <div className="card">
          <div className="card-label">Tổng chi</div>
          <div className="card-value red">{fmt(totalChi)}</div>
          <div className="card-sub">đồng</div>
        </div>
        <div className="card">
          <div className="card-label">Cân đối</div>
          <div className={`card-value ${canDoi >= 0 ? 'green' : 'red'}`}>{fmt(canDoi)}</div>
          <div className="card-sub">đồng</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3>Thu - Chi theo ngày (30 ngày gần nhất)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDay} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="ngay" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v/1000000).toFixed(0)+'M'} />
              <Tooltip formatter={v => fmt(v) + ' đ'} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="thu" name="Thu" fill="#22a06b" radius={[3,3,0,0]} />
              <Bar dataKey="chi" name="Chi" fill="#e03e3e" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Cơ cấu thu</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v) + ' đ'} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-box">
        <h3>Chi tiết khoản chi ({filtered.c.length} khoản)</h3>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Nội dung</th>
              <th>Bộ phận</th>
              <th>Mục đích</th>
              <th style={{ textAlign: 'right' }}>Số tiền</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {filtered.c.slice(0, 50).map((r, i) => (
              <tr key={i}>
                <td>{fmtDate(r['Ngày'])}</td>
                <td>{getText(r['NỘI DUNG CHI'])}</td>
                <td>{getText(r['BP THANH TOÁN'])}</td>
                <td>{getText(r['MỤC ĐÍCH CHI'])}</td>
                <td style={{ textAlign: 'right', color: '#e03e3e' }}>{fmt(getNum(r['SỐ TIỀN CHI']))}</td>
                <td style={{ color: '#888' }}>{getText(r['GHI CHÚ'])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.c.length > 50 && <div className="empty">Hiển thị 50/{filtered.c.length} khoản</div>}
      </div>
    </>
  );
}
