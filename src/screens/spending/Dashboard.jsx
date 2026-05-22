import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { fmt, fmtDate } from '../../utils';
import AddExpense from './AddExpense';
import AddIncome from './AddIncome';
import { Px, IClose } from '../../icons';

const SOURCE_ICONS = {
  salary:      'briefcase',
  freelance:   'computer',
  'e-transfer':'smartphone',
  gift:        'gift',
  refund:      'undo',
  other:       'plus',
};

const SOURCE_LABELS = {
  salary: 'Salary', freelance: 'Freelance', 'e-transfer': 'E-Transfer',
  gift: 'Gift', refund: 'Refund', other: 'Other',
};

export default function Dashboard() {
  const { categories, expenses, income, profile, deleteExpense, deleteIncome } = useApp();
  const [modal,     setModal]     = useState(null); // 'expense' | 'income' | null
  const [txFilter,  setTxFilter]  = useState('all'); // 'all' | 'income' | 'expenses'

  useEffect(() => {
    const onExpense = () => setModal('expense');
    const onIncome  = () => setModal('income');
    const onKey = e => {
      if (e.key === 'i' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setModal('income');
      }
    };
    window.addEventListener('shortcut:new', onExpense);
    window.addEventListener('shortcut:new-income', onIncome);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('shortcut:new', onExpense);
      window.removeEventListener('shortcut:new-income', onIncome);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const now       = new Date();
  const month     = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysLeft  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const currency  = profile.currency || '$';

  const totalSpent  = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const net         = totalIncome - totalSpent;

  const totalBudget = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const pct         = totalBudget > 0 ? Math.min(100, Math.round(totalSpent / totalBudget * 100)) : 0;

  const allTx = [
    ...expenses.map(e => ({ ...e, _type: 'expense' })),
    ...income.map(i => ({ ...i, _type: 'income' })),
  ].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));

  const filtered = txFilter === 'income'   ? allTx.filter(t => t._type === 'income')
                 : txFilter === 'expenses' ? allTx.filter(t => t._type === 'expense')
                 : allTx;

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{month}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sidebar-add-btn income-add-btn" onClick={() => setModal('income')}>+ Income</button>
          <button className="sidebar-add-btn" onClick={() => setModal('expense')}>+ Expense</button>
        </div>
      </div>

      <div className="finance-cards">
        <div className="finance-card income-card">
          <div className="fc-label">Income</div>
          <div className="fc-amount">{fmt(totalIncome, currency)}</div>
          <div className="fc-sub">{income.length} transaction{income.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="finance-card spent-card">
          <div className="fc-label">Spent</div>
          <div className="fc-amount">{fmt(totalSpent, currency)}</div>
          <div className="fc-sub">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</div>
        </div>
        <div className={`finance-card net-card ${net >= 0 ? 'net-positive' : 'net-negative'}`}>
          <div className="fc-label">Net</div>
          <div className="fc-amount">{net >= 0 ? '+' : ''}{fmt(net, currency)}</div>
          <div className="fc-sub">{daysLeft} days left</div>
        </div>
      </div>

      {totalBudget > 0 && (
        <div className="budget-bar-wrap">
          <div className="budget-bar-labels">
            <span>Budget: {fmt(totalBudget, currency)}</span>
            <span>{pct}% used · {fmt(Math.max(0, totalBudget - totalSpent), currency)} left</span>
          </div>
          <div className="prog-wrap">
            <div className="prog-fill" style={{ width: pct + '%', background: pct > 85 ? 'var(--danger)' : 'var(--accent)' }} />
          </div>
        </div>
      )}

      <div className="tx-filter-tabs">
        {[['all','All'], ['income','Income'], ['expenses','Expenses']].map(([v, l]) => (
          <button key={v} className={'tx-filter-tab' + (txFilter === v ? ' active' : '')} onClick={() => setTxFilter(v)}>{l}</button>
        ))}
      </div>

      <div className="tx-list">
        {filtered.length === 0 ? (
          <div className="empty-state">No transactions yet.</div>
        ) : filtered.map(tx => tx._type === 'income' ? (
          <div className="tx-item tx-item-income" key={'i' + tx.id}>
            <div className="tx-icon"><Px name={SOURCE_ICONS[tx.source] || 'plus'} size={16} /></div>
            <div className="tx-info">
              <div className="tx-name">
                {tx.description}
                {tx.recurring ? <span className="tx-recurring-badge">{tx.recurring_period}</span> : null}
              </div>
              <div className="tx-cat">{SOURCE_LABELS[tx.source] || tx.source}</div>
            </div>
            <div className="tx-right">
              <div className="tx-amount tx-amount-income">+{fmt(tx.amount, currency)}</div>
              <div className="tx-date">{fmtDate(tx.date)}</div>
            </div>
            <button className="tx-delete" onClick={() => deleteIncome(tx.id)}><IClose /></button>
          </div>
        ) : (
          <div className="tx-item" key={'e' + tx.id}>
            <div className="tx-icon"><Px name={tx.category_icon} size={16} /></div>
            <div className="tx-info">
              <div className="tx-name">
                {tx.description}
                {tx.recurring ? <span className="tx-recurring-badge">{tx.recurring_period}</span> : null}
              </div>
              <div className="tx-cat">{tx.category_name}</div>
            </div>
            <div className="tx-right">
              <div className="tx-amount">-{fmt(tx.amount, currency)}</div>
              <div className="tx-date">{fmtDate(tx.date)}</div>
            </div>
            <button className="tx-delete" onClick={() => deleteExpense(tx.id)}><IClose /></button>
          </div>
        ))}
      </div>

      {modal === 'expense' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <AddExpense onClose={() => setModal(null)} />
          </div>
        </div>
      )}
      {modal === 'income' && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-box">
            <AddIncome onClose={() => setModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
