import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../utils';

const FitnessContext = createContext(null);

export function FitnessProvider({ children }) {
  const [workouts,   setWorkouts]   = useState([]);
  const [metrics,    setMetrics]    = useState([]);
  const [history,    setHistory]    = useState([]);
  const [runs,       setRuns]       = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [toast,      setToast]      = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const loadWorkouts = useCallback(async () => {
    const w = await apiFetch('/api/fitness/workouts');
    if (!w.error) setWorkouts(w);
  }, []);

  const loadAll = useCallback(async () => {
    const [w, m, h, r, rh] = await Promise.all([
      apiFetch('/api/fitness/workouts'),
      apiFetch('/api/fitness/metrics'),
      apiFetch('/api/fitness/metrics/history'),
      apiFetch('/api/runs'),
      apiFetch('/api/runs/history'),
    ]);
    if (!w.error)  setWorkouts(w);
    if (!m.error)  setMetrics(m);
    if (!h.error)  setHistory(h);
    if (!r.error)  setRuns(r);
    if (!rh.error) setRunHistory(rh);
  }, []);

  const addWorkout = useCallback(async (data) => {
    const res = await apiFetch('/api/fitness/workouts', { method: 'POST', body: JSON.stringify(data) });
    if (res.error) { showToast(res.error); return; }
    await loadWorkouts();
    showToast('Workout logged');
    return res.id;
  }, [loadWorkouts, showToast]);

  const updateWorkout = useCallback(async (id, data) => {
    const res = await apiFetch('/api/fitness/workouts/' + id, { method: 'PUT', body: JSON.stringify(data) });
    if (res.error) { showToast(res.error); return; }
    await loadWorkouts();
    showToast('Workout updated');
  }, [loadWorkouts, showToast]);

  const deleteWorkout = useCallback(async (id) => {
    await apiFetch('/api/fitness/workouts/' + id, { method: 'DELETE' });
    setWorkouts(prev => prev.filter(w => w.id !== id));
    showToast('Deleted');
  }, [showToast]);

  const addSet = useCallback(async (workoutId, data) => {
    const res = await apiFetch('/api/fitness/workouts/' + workoutId + '/sets', { method: 'POST', body: JSON.stringify(data) });
    if (!res.error) await loadWorkouts();
  }, [loadWorkouts]);

  const updateSet = useCallback(async (setId, data) => {
    const res = await apiFetch('/api/fitness/sets/' + setId, { method: 'PUT', body: JSON.stringify(data) });
    if (!res.error) await loadWorkouts();
  }, [loadWorkouts]);

  const deleteSet = useCallback(async (setId) => {
    const res = await apiFetch('/api/fitness/sets/' + setId, { method: 'DELETE' });
    if (!res.error) await loadWorkouts();
  }, [loadWorkouts]);

  const addMetric = useCallback(async (data) => {
    const res = await apiFetch('/api/fitness/metrics', { method: 'POST', body: JSON.stringify(data) });
    if (res.error) { showToast(res.error); return; }
    const [m, h] = await Promise.all([
      apiFetch('/api/fitness/metrics'),
      apiFetch('/api/fitness/metrics/history'),
    ]);
    if (!m.error) setMetrics(m);
    if (!h.error) setHistory(h);
    showToast('Measurement saved');
  }, [showToast]);

  const deleteMetric = useCallback(async (id) => {
    await apiFetch('/api/fitness/metrics/' + id, { method: 'DELETE' });
    const [m, h] = await Promise.all([
      apiFetch('/api/fitness/metrics'),
      apiFetch('/api/fitness/metrics/history'),
    ]);
    if (!m.error) setMetrics(m);
    if (!h.error) setHistory(h);
    showToast('Deleted');
  }, [showToast]);

  const refreshRuns = useCallback(async () => {
    const [r, rh] = await Promise.all([apiFetch('/api/runs'), apiFetch('/api/runs/history')]);
    if (!r.error)  setRuns(r);
    if (!rh.error) setRunHistory(rh);
  }, []);

  const addRun = useCallback(async (data) => {
    const res = await apiFetch('/api/runs', { method: 'POST', body: JSON.stringify(data) });
    if (res.error) { showToast(res.error); return; }
    await refreshRuns();
    showToast('Run logged');
  }, [refreshRuns, showToast]);

  const updateRun = useCallback(async (id, data) => {
    const res = await apiFetch('/api/runs/' + id, { method: 'PUT', body: JSON.stringify(data) });
    if (res.error) { showToast(res.error); return; }
    await refreshRuns();
    showToast('Run updated');
  }, [refreshRuns, showToast]);

  const deleteRun = useCallback(async (id) => {
    await apiFetch('/api/runs/' + id, { method: 'DELETE' });
    setRuns(prev => prev.filter(r => r.id !== id));
    showToast('Deleted');
  }, [showToast]);

  return (
    <FitnessContext.Provider value={{
      workouts, metrics, history, runs, runHistory, toast,
      loadAll, addWorkout, updateWorkout, deleteWorkout, addSet, updateSet, deleteSet,
      addMetric, deleteMetric, addRun, updateRun, deleteRun, showToast,
    }}>
      {children}
    </FitnessContext.Provider>
  );
}

export const useFitness = () => useContext(FitnessContext);
