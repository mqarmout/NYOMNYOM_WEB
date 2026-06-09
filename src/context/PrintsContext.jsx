import { createContext, useCallback, useContext, useState } from "react";
import { useToast } from "../hooks/useToast";
import { apiFetch } from "../utils";

const PrintsContext = createContext(null);

export function PrintsProvider({ children }) {
  const [prints, setPrints] = useState([]);
  const [stats, setStats] = useState(null);
  const { toast, showToast } = useToast();

  const loadAll = useCallback(async () => {
    const [p, s] = await Promise.all([
      apiFetch("/api/prints"),
      apiFetch("/api/prints/stats"),
    ]);
    if (!p.error) setPrints(p);
    if (!s.error) setStats(s);
  }, []);

  const addPrint = useCallback(
    async (data) => {
      const res = await apiFetch("/api/prints", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.error) { showToast(res.error); return null; }
      await loadAll();
      showToast("Print logged");
      return res;
    },
    [loadAll, showToast]
  );

  const updatePrint = useCallback(
    async (id, data) => {
      const res = await apiFetch(`/api/prints/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (res.error) { showToast(res.error); return; }
      await loadAll();
      showToast("Print updated");
    },
    [loadAll, showToast]
  );

  const deletePrint = useCallback(
    async (id) => {
      await apiFetch(`/api/prints/${id}`, { method: "DELETE" });
      setPrints((prev) => prev.filter((p) => p.id !== id));
      setStats(null);
      apiFetch("/api/prints/stats").then((s) => { if (!s.error) setStats(s); });
      showToast("Deleted");
    },
    [showToast]
  );

  return (
    <PrintsContext.Provider
      value={{ prints, stats, toast, loadAll, addPrint, updatePrint, deletePrint, showToast }}
    >
      {children}
    </PrintsContext.Provider>
  );
}

export const usePrints = () => useContext(PrintsContext);
