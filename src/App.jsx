import { useState } from 'react';
import './index.css';
import ThuChi from './pages/ThuChi';
import DoanhThu from './pages/DoanhThu';
import Sale from './pages/Sale';

const NAV = [
  { id: 'thuchi',   icon: '💵', label: 'Thu Chi Tiền Mặt' },
  { id: 'doanhthu', icon: '📊', label: 'Doanh Thu' },
  { id: 'sale',     icon: '📞', label: 'Sale Phone / Khách' },
];

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};

const monthOptions = () => {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = `Tháng ${d.getMonth()+1}/${d.getFullYear()}`;
    opts.push({ val, label });
  }
  return opts;
};

export default function App() {
  const [page, setPage] = useState('thuchi');
  const [filterMonth, setFilterMonth] = useState(thisMonth());

  const titles = {
    thuchi: 'Báo Cáo Thu Chi Tiền Mặt',
    doanhthu: 'Báo Cáo Doanh Thu',
    sale: 'Báo Cáo Sale Phone / Khách',
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Báo Cáo Lễ Tân</h2>
          <p>Viola Clinic</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <div
              key={n.id}
              className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main">
        <div className="topbar">
          <h1>{titles[page]}</h1>
          <div className="filter-bar">
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="">Tất cả thời gian</option>
              {monthOptions().map(o => (
                <option key={o.val} value={o.val}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="content">
          {page === 'thuchi'   && <ThuChi   filterMonth={filterMonth} />}
          {page === 'doanhthu' && <DoanhThu filterMonth={filterMonth} />}
          {page === 'sale'     && <Sale     filterMonth={filterMonth} />}
        </div>
      </div>
    </div>
  );
}
