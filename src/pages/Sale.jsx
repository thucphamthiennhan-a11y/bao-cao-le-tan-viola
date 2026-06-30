import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { fmt, fmtDate, getNum, getText } from '../utils';

const COLORS = ['#22a06b', '#0055cc', '#c8a951', '#e03e3e', '#9b59b6', '#e67e22'];

export default function Sale({ filterMonth }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/sale').then(r => { setData(r.data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!filterMonth) return data;
    return data.filter(r => {
      const ngay = r['Ngày Tạo Đầu Tiên'];
      if (!ngay) return false;
      const d = new Date(ngay);
      const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return ym === filterMonth;
    });
  }, [data, filterMonth]);

  const byTrangThai = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = getText(r['Trạng Thái']) || 'Chưa xác định';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  const byNguon = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = getText(r['NGUỒN']) || 'Khác';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  const bySalePhone = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = getText(r['Sale phone']) || 'Chưa phân công';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([ten, soKhach]) => ({ ten, soKhach })).sort((a,b) => b.soKhach - a.soKhach).slice(0,10);
  }, [filtered]);

  const byPhanLoai = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = getText(r['PHÂN LOẠI SALE']) || 'Chưa phân loại';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải dữ liệu...</div>;

  return (
    <>
      <div className="cards-grid">
        <div className="card">
          <div className="card-label">Tổng khách</div>
          <div className="card-value blue">{fmt(filtered.length)}</div>
          <div className="card-sub">lượt tiếp cận</div>
        </div>
        <div className="card">
          <div className="card-label">Trạng thái</div>
          <div className="card-value gold">{byTrangThai.length}</div>
          <div className="card-sub">loại trạng thái</div>
        </div>
        <div className="card">
          <div className="card-label">Nguồn</div>
          <div className="card-value">{byNguon.length}</div>
          <div className="card-sub">kênh tiếp cận</div>
        </div>
        <div className="card">
          <div className="card-label">Sale phone</div>
          <div className="card-value green">{bySalePhone.length}</div>
          <div className="card-sub">nhân viên</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3>Sale phone theo nhân viên</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySalePhone} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="ten" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="soKhach" name="Số khách" fill="#0055cc" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Cơ cấu nguồn</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byNguon.slice(0,6)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ''}>
                {byNguon.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3>Trạng thái khách hàng</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTrangThai.slice(0,8)} margin={{ left: 10, right: 10 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Số khách" fill="#22a06b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Phân loại sale</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byPhanLoai} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {byPhanLoai.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-box">
        <h3>Danh sách khách ({filtered.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Tên KH</th>
              <th>Trạng thái</th>
              <th>Nguồn</th>
              <th>Phân loại</th>
              <th>Sale phone</th>
              <th>Tư vấn</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0,50).map((r, i) => (
              <tr key={i}>
                <td>{fmtDate(r['Ngày Tạo Đầu Tiên'])}</td>
                <td>{getText(r['Tên Kh'])}</td>
                <td><span className="badge badge-blue">{getText(r['Trạng Thái'])}</span></td>
                <td>{getText(r['NGUỒN'])}</td>
                <td>{getText(r['PHÂN LOẠI SALE'])}</td>
                <td>{getText(r['Sale phone'])}</td>
                <td>{getText(r['Tư vấn'])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 50 && <div className="empty">Hiển thị 50/{filtered.length} khách</div>}
      </div>
    </>
  );
}
