import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { fmt, fmtDate, getInitials } from "../utils";

export default function Profile() {
  const { profile, categories, expenses, saveProfile } = useApp();
  const [name, setName] = useState(profile.name || "");
  const [curr, setCurr] = useState(profile.currency || "$");

  useEffect(() => {
    setName(profile.name || "");
    setCurr(profile.currency || "$");
  }, [profile]);

  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const currency = profile.currency || "$";

  const handleSave = () => {
    saveProfile({ name: name.trim(), currency: curr });
  };

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your account and settings</p>
      </div>

      <div className="profile-layout">
        <div className="profile-hero">
          <div className="profile-avatar">{getInitials(profile.name)}</div>
          <div className="profile-name">{profile.name || "Your Profile"}</div>
          <div className="profile-since">
            {profile.since ? "Tracking since " + fmtDate(profile.since) : "No expenses logged yet"}
          </div>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="s-lbl">This Month</div>
              <div className="s-val">{fmt(monthTotal, currency)}</div>
            </div>
            <div className="stat-card">
              <div className="s-lbl">All Time</div>
              <div className="s-val">{fmt(profile.total_all_time || 0, currency)}</div>
            </div>
            <div className="stat-card">
              <div className="s-lbl">Transactions</div>
              <div className="s-val">{profile.tx_count || 0}</div>
            </div>
            <div className="stat-card">
              <div className="s-lbl">Categories</div>
              <div className="s-val">{categories.length}</div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Settings</div>

          <div className="settings-row">
            <div className="settings-row-label">Display Name</div>
            <input
              className="settings-row-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="settings-row">
            <div className="settings-row-label">Currency</div>
            <select
              className="settings-row-input"
              value={curr}
              onChange={(e) => setCurr(e.target.value)}
            >
              <option value="$">$ Dollar</option>
              <option value="€">€ Euro</option>
              <option value="£">£ Pound</option>
              <option value="¥">¥ Yen</option>
              <option value="₹">₹ Rupee</option>
              <option value="ر.س">ر.س Riyal</option>
            </select>
          </div>

          <button className="save-btn" onClick={handleSave}>
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
