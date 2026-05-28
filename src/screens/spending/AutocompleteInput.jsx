import { useState, useRef, useEffect } from "react";

export default function AutocompleteInput({ value, onChange, suggestions, placeholder, id }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  const filtered = suggestions.filter((s) => s.toLowerCase().includes((value || "").toLowerCase()));
  const showList = focused && filtered.length > 0 && value !== filtered[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = (s) => {
    onChange(s);
    setOpen(false);
    setFocused(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setFocused(false);
          }
        }}
      />
      {open && showList && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--bg2, #1a1a2e)",
            border: "1px solid var(--border, #333)",
            borderRadius: 6,
            margin: "2px 0 0",
            padding: 0,
            listStyle: "none",
            maxHeight: 180,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => pick(s)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "0.85rem",
                borderBottom: "1px solid var(--border, #222)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3, #252540)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
