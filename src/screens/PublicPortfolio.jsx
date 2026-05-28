import { useState, useEffect } from "react";
import { apiFetch, getInitials } from "../utils";
import SignIn from "./SignIn";
import { Px, IExtLink } from "../icons";

function formatDateRange(start, end) {
  if (!start) return "";
  const fmt = (d) => {
    const [y, m] = d.split("-");
    return new Date(y, parseInt(m) - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };
  return fmt(start) + (end ? " – " + fmt(end) : " – Present");
}

export default function PublicPortfolio({ onLogin }) {
  const [data, setData] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    apiFetch("/api/public/portfolio").then((res) => {
      if (!res.error) setData(res);
    });
  }, []);

  if (!data) return <div className="auth-loading">Loading…</div>;

  const { about, projects, skills, experience } = data;

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="public-page">
      <header className="public-header">
        <span className="public-header-logo">NYOMNYOM</span>
        <button className="public-signin-btn" onClick={() => setShowSignIn(true)}>
          Sign In
        </button>
      </header>

      <div className="public-container">
        {/* Hero */}
        <section className="public-hero">
          <div className="public-avatar">{getInitials(about.display_name || "?")}</div>
          <h1 className="public-name">{about.display_name || "Portfolio"}</h1>
          {about.headline && <p className="public-headline">{about.headline}</p>}
          {about.location && (
            <p className="public-location">
              <Px name="map-pin" size={11} /> {about.location}
            </p>
          )}
          {about.bio && <p className="public-bio">{about.bio}</p>}
          <div className="public-links">
            {about.website && (
              <a href={about.website} target="_blank" rel="noreferrer">
                <Px name="globe" size={13} /> Website
              </a>
            )}
            {about.github && (
              <a href={"https://github.com/" + about.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            )}
            {about.linkedin && (
              <a
                href={"https://linkedin.com/in/" + about.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            )}
          </div>
        </section>

        {/* Projects */}
        {projects.length > 0 && (
          <section className="public-section">
            <h2 className="public-section-title">Projects</h2>
            <div className="project-grid">
              {projects.map((p) => (
                <div className="project-card" key={p.id}>
                  <div className="project-card-header">
                    <div className="project-title">{p.title}</div>
                  </div>
                  {p.description && <p className="project-desc">{p.description}</p>}
                  {p.tech_stack && (
                    <div className="project-tags">
                      {p.tech_stack
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((t) => (
                          <span className="project-tag" key={t}>
                            {t}
                          </span>
                        ))}
                    </div>
                  )}
                  <div className="project-links">
                    {p.github_url && (
                      <a
                        href={p.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="project-link"
                      >
                        GitHub <IExtLink />
                      </a>
                    )}
                    {p.live_url && (
                      <a
                        href={p.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="project-link"
                      >
                        Live <IExtLink />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="public-section">
            <h2 className="public-section-title">Skills</h2>
            <div className="skills-section-list">
              {Object.keys(grouped)
                .sort()
                .map((cat) => (
                  <div className="skills-group" key={cat}>
                    <div className="skills-group-title">{cat}</div>
                    <div className="skill-chips">
                      {grouped[cat].map((s) => (
                        <div className="skill-chip public-chip" key={s.id}>
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="public-section">
            <h2 className="public-section-title">Experience</h2>
            <div className="timeline">
              {experience.map((e) => (
                <div className="timeline-item" key={e.id}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-header" style={{ display: "block" }}>
                      <div className="timeline-role">{e.role}</div>
                      <div className="timeline-company">{e.company}</div>
                      <div className="timeline-dates">
                        {formatDateRange(e.start_date, e.end_date)}
                      </div>
                    </div>
                    {e.description && <p className="timeline-desc">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {showSignIn && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <SignIn onLogin={onLogin} onClose={() => setShowSignIn(false)} />
        </div>
      )}
    </div>
  );
}
