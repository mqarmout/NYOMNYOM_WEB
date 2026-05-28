import { useState, useEffect } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { getInitials } from "../../utils";

export default function About() {
  const { about, loadAll, saveAbout } = usePortfolio();
  const [form, setForm] = useState({
    display_name: "",
    headline: "",
    bio: "",
    location: "",
    website: "",
    github: "",
    linkedin: "",
  });

  useEffect(() => {
    loadAll();
  }, [loadAll]);
  useEffect(() => {
    setForm(about);
  }, [about]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="screen">
      <div className="page-header">
        <h1>About</h1>
        <p>Your public profile information</p>
      </div>

      <div className="about-layout">
        <div className="about-preview">
          <div className="profile-avatar" style={{ margin: "0 auto 16px" }}>
            {getInitials(form.display_name || "?")}
          </div>
          <div className="profile-name">{form.display_name || "Your Name"}</div>
          {form.headline && <div className="about-headline">{form.headline}</div>}
          {form.location && <div className="about-location">📍 {form.location}</div>}
          {form.bio && <p className="about-bio">{form.bio}</p>}
          <div className="about-links">
            {form.website && (
              <a href={form.website} target="_blank" rel="noreferrer">
                🌐 Website
              </a>
            )}
            {form.github && (
              <a href={"https://github.com/" + form.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            {form.linkedin && (
              <a href={"https://linkedin.com/in/" + form.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-card-title">Edit About</div>
          {[
            { key: "display_name", label: "Display Name", placeholder: "Your full name" },
            { key: "headline", label: "Headline", placeholder: "e.g. Full-Stack Developer" },
            { key: "location", label: "Location", placeholder: "e.g. Riyadh, SA" },
            { key: "website", label: "Website URL", placeholder: "https://yoursite.com" },
            { key: "github", label: "GitHub Username", placeholder: "your-username" },
            { key: "linkedin", label: "LinkedIn Username", placeholder: "your-username" },
          ].map((f) => (
            <div className="settings-row" key={f.key}>
              <div className="settings-row-label">{f.label}</div>
              <input
                className="settings-row-input"
                type="text"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={set(f.key)}
              />
            </div>
          ))}
          <div className="field" style={{ marginTop: 16 }}>
            <label>Bio</label>
            <textarea
              placeholder="A short bio about yourself..."
              value={form.bio}
              onChange={set("bio")}
              rows={4}
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--text)",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
          <button className="save-btn" onClick={() => saveAbout(form)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
