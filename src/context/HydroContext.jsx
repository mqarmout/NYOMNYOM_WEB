import { createContext, useCallback, useContext, useState } from "react";
import { useToast } from "../hooks/useToast";
import { apiFetch } from "../utils";

const HydroContext = createContext(null);

export function HydroProvider({ children }) {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [pump, setPump] = useState(null);
  const [pumpLog, setPumpLog] = useState([]);
  const [dosing, setDosing] = useState([]);
  const [plants, setPlants] = useState([]);
  const { toast, showToast: _toast } = useToast();

  const loadAll = useCallback(async () => {
    const [readings, pumpData, dosingData, plantsData, pumpLogData] = await Promise.all([
      apiFetch("/api/hydro/readings"),
      apiFetch("/api/hydro/pump"),
      apiFetch("/api/hydro/dosing"),
      apiFetch("/api/hydro/plants"),
      apiFetch("/api/hydro/pump/log"),
    ]);
    if (readings.history !== undefined) {
      setLatest(readings.latest);
      setHistory(readings.history);
    }
    if (!pumpData.error) setPump(pumpData);
    if (Array.isArray(dosingData)) setDosing(dosingData);
    if (Array.isArray(plantsData)) setPlants(plantsData);
    if (Array.isArray(pumpLogData)) setPumpLog(pumpLogData);
  }, []);

  const addReading = useCallback(
    async (data) => {
      const r = await apiFetch("/api/hydro/readings", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!r.error) {
        await loadAll();
        _toast("Reading logged");
      }
      return r;
    },
    [loadAll]
  );

  const updatePump = useCallback(
    async (data) => {
      const r = await apiFetch("/api/hydro/pump", { method: "PUT", body: JSON.stringify(data) });
      if (!r.error) {
        await loadAll();
        _toast("Pump schedule updated");
      }
      return r;
    },
    [loadAll]
  );

  const triggerPump = useCallback(async () => {
    const r = await apiFetch("/api/hydro/pump/trigger", { method: "POST" });
    if (!r.error) {
      await loadAll();
      _toast("Pump triggered manually");
    }
    return r;
  }, [loadAll]);

  const addDosing = useCallback(
    async (data) => {
      const r = await apiFetch("/api/hydro/dosing", { method: "POST", body: JSON.stringify(data) });
      if (!r.error) {
        await loadAll();
        _toast("Dosing logged");
      }
      return r;
    },
    [loadAll]
  );

  const deleteDosing = useCallback(async (id) => {
    await apiFetch(`/api/hydro/dosing/${id}`, { method: "DELETE" });
    setDosing((d) => d.filter((x) => x.id !== id));
  }, []);

  const addPlant = useCallback(
    async (data) => {
      const r = await apiFetch("/api/hydro/plants", { method: "POST", body: JSON.stringify(data) });
      if (!r.error) {
        await loadAll();
        _toast("Plant added");
      }
      return r;
    },
    [loadAll]
  );

  const updatePlant = useCallback(
    async (id, data) => {
      const r = await apiFetch(`/api/hydro/plants/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!r.error) {
        await loadAll();
        _toast("Plant updated");
      }
      return r;
    },
    [loadAll]
  );

  const deletePlant = useCallback(async (id) => {
    await apiFetch(`/api/hydro/plants/${id}`, { method: "DELETE" });
    setPlants((p) => p.filter((x) => x.id !== id));
  }, []);

  return (
    <HydroContext.Provider
      value={{
        latest,
        history,
        pump,
        pumpLog,
        dosing,
        plants,
        toast,
        loadAll,
        addReading,
        updatePump,
        triggerPump,
        addDosing,
        deleteDosing,
        addPlant,
        updatePlant,
        deletePlant,
      }}
    >
      {children}
    </HydroContext.Provider>
  );
}

export function useHydro() {
  return useContext(HydroContext);
}
