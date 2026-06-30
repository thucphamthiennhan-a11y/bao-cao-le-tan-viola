import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fmt, fmtDate, getNum, getText } from '../utils';

const COLORS = ['#22a06b', '#0055cc', '#c8a951', '#e03e3e', '#9b59b6', '#e67e22', '#1abc9c', '#e74c3c'];

export default function DoanhThu({ filterMonth }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/doanhthu').then(r => { setData(r.data); setLoading(false); });
  }, []);

  const filtered = useMemo(() =>
    filterMonth ? data.filter(r => {
      const d = r['Ngày']; if (!d) return false;
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}` === filterMonth;
    }) : data
  , [data, filterMonth]);

  const totalDT = useMemo(() =>
    filtered.reduce((s, r) => s + getNum(r['Tiền mặt']) + getNum(r['Chuyển khoản']) + getNum(r['Quẹt thẻ']) + getNum(r['Trả góp']), 0)
  , [filtered]);

  const totalGiam = useMemo(() => filtered.reduce((s, r) => s + getNum(r['Số tiền giảm']), 0), [filtered]);

  const byTuvan = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = getText(r['Người tư vấn']) || 'Chưa có';
      if (!map[k]) map[k] = { ten: k, doanhThu: 0, soKhach: 0 };
      map[k].doanhThu += getNum(r['Tiền mặt']) + getNum(r['Chuyển khoản']) + getNum(r['Quẹt thẻ']) + getNum(r['Trả góp']);
      map[k].soKhach += 1;
    });
    return Object.values(map).sort((a,b) => b.doanhThu - a.doanhThu).slice(0,10);
  }, [filtered]);

  const byDichVu = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = getText(r['Phân nhóm dịch vụ']) || getText(r['Dịch vụ']) || 'Khác';
      if (!map[k]) map[k] = { name: k, value: 0 };
      map[k].value += getNum(r['Tiền mặt']) + getNum(r['Chuyển khoản']) + getNum(r['Quẹt thẻ']) + getNum(r['Trả góp']);
    });
    return Object.values(map).sort((a,b) => b.value - a.value).slice(0,8);
  }, [filtered]);

  const byNguon = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const k = getText(r['Nguồn']) || 'Khác';
      if (!map[k]) map[k] = { name: k, value: 0 };
      map[k].value += getNum(r['Tiền mặt']) + getNum(r['Chuyển khoản']) + getNum(r['Quẹt thẻ']) + getNum(r['Trả góp']);
    });
    return Object.values(map).sort((a,b) => b.value - a.value);
  }, [filtered]);

  if (loading) return <div className="loading"><div className="spinner" /> Đang tải dữ liệu...</div>;

  return (
    <>
      <div className="cards-grid">
        <div className="card">
          <div className="card-label">Doanh thu</div>
          <div className="card-value green">{fmt(totalDT)}</div>
          <div className="card-sub">đồng</div>
        </div>
        <div className="card">
          <div className="card-label">Số đơn</div>
          <div className="card-value blue">{fmt(filtered.length)}</div>
          <div className="card-sub">đơn hàng</div>
        </div>
        <div className="card">
          <div className="card-label">Giảm giá</div>
          <div className="card-value red">{fmt(totalGiam)}</div>
          <div className="card-sub">đồng</div>
        </div>
        <div className="card">
          <div className="card-label">TB / đơn</div>
          <div className="card-value gold">{filtered.length ? fmt(totalDT / filtered.length) : 0}</div>
          <div className="card-sub">đồng</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3>Doanh thu theo tư vấn</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byTuvan} layout="vertical" margin={{ left: 90, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => (v/1000000).toFixed(0)+'M'} />
              <YAxis dataKey="ten" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={v => fmt(v) + ' đ'} />
              <Bar dataKey="doanhThu" name="Doanh thu" fill="#22a06b" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Cơ cấu dịch vụ</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byDichVu} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ percent }) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ''}>
                {byDichVu.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => fmt(v) + ' đ'} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-box" style={{ marginBottom: 20 }}>
        <h3>Doanh thu theo nguồn</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byNguon} margin={{ left: 10, right: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => (v/1000000).toFixed(0)+'M'} />
            <Tooltip formatter={v => fmt(v) + ' đ'} />
            <Bar dataKey="value" name="Doanh thu" fill="#0055cc" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-box">
        <h3>Chi tiết đơn hàng ({filtered.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Tên KH</th>
              <th>Dịch vụ</th>
              <th>Tư vấn</th>
              <th>Nguồn</th>
              <th style={{ textAlign: 'right' }}>Tiền mặt</th>
              <th style={{ textAlign: 'right' }}>CK</th>
              <th style={{ textAlign: 'right' }}>Tổng</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((r, i) => {
              const tong = getNum(r['Tiền mặt']) + getNum(r['Chuyển khoản']) + getNum(r['Quẹt thẻ']) + getNum(r['Trả góp']);
              return (
                <tr key={i}>
                  <td>{fmtDate(r['Ngày'])}</td>
                  <td>{getText(r['Tên KH'])}</td>
                  <td>{getText(r['Phân nhóm dịch vụ']) || getText(r['Dịch vụ'])}</td>
                  <td>{getText(r['Người tư vấn'])}</td>
                  <td>{getText(r['Nguồn'])}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(getNum(r['Tiền mặt']))}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(getNum(r['Chuyển khoản']))}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#22a06b' }}>{fmt(tong)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 50 && <div className="empty">Hiển thị 50/{filtered.length} đơn</div>}
      </div>
    </>
  );
}
