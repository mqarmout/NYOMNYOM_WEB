import { useState, useEffect } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { IClose } from "../../icons";

export default function Skills() {
  const { skills, loadAll, addSkill, deleteSkill } = usePortfolio();
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const grouped = skills.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addSkill({ name: newName.trim(), category: newCategory.trim() || null });
    setNewName("");
  };

  const categories = Object.keys(grouped).sort();

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Skills</h1>
        <p>
          {skills.length} skill{skills.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="skill-add-row">
        <div className="field" style={{ flex: 2, marginBottom: 0 }}>
          <label>Skill</label>
          <input
            type="text"
            placeholder="e.g. Python"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Category</label>
          <input
            type="text"
            placeholder="e.g. Languages"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <button
          className="sidebar-add-btn"
          style={{ width: "auto", padding: "12px 20px", alignSelf: "flex-end" }}
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          Add
        </button>
      </div>

      {skills.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 32 }}>
          No skills yet. Add your first one above.
        </div>
      ) : (
        <div className="skills-section-list">
          {categories.map((cat) => (
            <div className="skills-group" key={cat}>
              <div className="skills-group-title">{cat}</div>
              <div className="skill-chips">
                {grouped[cat].map((s) => (
                  <div className="skill-chip" key={s.id}>
                    {s.name}
                    <button onClick={() => deleteSkill(s.id)}>
                      <IClose />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
