import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fmt, fmtDate } from '../../utils';
import AddExpense from './AddExpense';
import { Px, IClose } from '../../icons';

export default function Dashboard() {
  const { categories, expenses, profile, deleteExpense } = useApp();
  const [filterCatId, setFilterCatId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const now      = new Date();
  const month    = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

  const filtered = filterCatId ? expenses.filter(e => e.category_id === filterCatId) : expenses;
  const total    = filtered.reduce((s, e) => s + e.amount, 0);

  const totalBudget = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const remaining   = Math.max(0, totalBudget - total);
  const pct         = totalBudget > 0 ? Math.min(100, Math.round(total / totalBudget * 100)) : 0;
  const currency    = profile.currency || '$';

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{month}</p>
        </div>
        <button className="sidebar-add-btn" onClick={() => setShowAdd(true)}>
          + Add Expense
        </button>
      </div>

      <div className="stats-row">
        <div className="balance-card">
          <div className="lbl">Total Spent This Month</div>
          <div className="amount">{fmt(total, currency)}</div>
          <div className="balance-meta">
            <div className="bm-item">
              <div className="bm-lbl">Budget</div>
              <div className="bm-val">{totalBudget > 0 ? fmt(totalBudget, currency) : '—'}</div>
            </div>
            <div className="bm-item">
              <div className="bm-lbl">Remaining</div>
              <div className="bm-val">{totalBudget > 0 ? fmt(remaining, currency) : '—'}</div>
            </div>
          </div>
          {totalBudget > 0 && (
            <>
              <div className="prog-wrap">
                <div
                  className="prog-fill"
                  style={{ width: pct + '%', background: pct > 85 ? 'var(--danger)' : 'var(--accent)' }}
                />
              </div>
              <div className="prog-meta">
                <span>{pct}% used</span>
                <span>{daysLeft} days left</span>
              </div>
            </>
          )}
        </div>

        <div className="stats-side">
          <div className="mini-stat">
            <div className="ms-lbl">Transactions</div>
            <div className="ms-val">{expenses.length}</div>
            <div className="ms-sub">this month</div>
          </div>
          <div className="mini-stat">
            <div className="ms-lbl">Days Left</div>
            <div className="ms-val">{daysLeft}</div>
            <div className="ms-sub">in {month.split(' ')[0]}</div>
          </div>
        </div>
      </div>

      <div className="section-title">Filter by Category</div>
      <div className="chips">
        <button
          className={'chip ' + (filterCatId === null ? 'active' : 'inactive')}
          onClick={() => setFilterCatId(null)}
        >All</button>
        {categories.map(c => (
          <button
            key={c.id}
            className={'chip ' + (filterCatId === c.id ? 'active' : 'inactive')}
            onClick={() => setFilterCatId(c.id)}
          ><Px name={c.icon} size={12} /> {c.name}</button>
        ))}
      </div>

      <div className="section-title">Recent Transactions</div>
      <div className="tx-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No expenses yet.<br />Click <strong>+ Add Expense</strong> to get started.</div>
        ) : filtered.map(e => (
          <div className="tx-item" key={e.id}>
            <div className="tx-icon"><Px name={e.category_icon} size={16} /></div>
            <div className="tx-info">
              <div className="tx-name">{e.description}</div>
              <div className="tx-cat">{e.category_name}</div>
            </div>
            <div className="tx-right">
              <div className="tx-amount">-{fmt(e.amount, currency)}</div>
              <div className="tx-date">{fmtDate(e.date)}</div>
            </div>
            <button className="tx-delete" onClick={() => deleteExpense(e.id)}><IClose /></button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal-box">
            <AddExpense onClose={() => setShowAdd(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
