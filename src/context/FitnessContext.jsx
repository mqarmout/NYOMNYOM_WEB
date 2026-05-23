import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../utils';

const FitnessContext = createContext(null);

export function FitnessProvider({ children }) {
  const [workouts,    setWorkouts]    = useState([]);
  const [metrics,     setMetrics]     = useState([]);
  const [history,     setHistory]     = useState([]);
  const [runs,        setRuns]        = useState([]);
  const [runHistory,  setRunHistory]  = useState([]);
  const [toast,       setToast]       = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const loadAll = useCallback(async () => {
    const [w, m, h, r, rh] = await Promise.all([
      apiFetch('/api/fitness/workouts'),
      apiFetch('/api/fitness/metrics'),
      apiFetch('/api/fitness/metrics/history'),
      apiFetch('/api/runs'),
      apiFetch('/api/runs/history'),
    ]);
    setWorkouts(w);
    setMetrics(m);
    setHistory(h);
    setRuns(r);
    setRunHistory(rh);
  }, []);

  const addWorkout = useCallback(async (data) => {
    const res = await apiFetch('/api/fitness/workouts', { method: 'POST', body: JSON.stringify(data) });
    setWorkouts(await apiFetch('/api/fitness/workouts'));
    showToast('Workout logged ✓');
    return res.id;
  }, [showToast]);

  const updateWorkout = useCallback(async (id, data) => {
    await apiFetch('/api/fitness/workouts/' + id, { method: 'PUT', body: JSON.stringify(data) });
    setWorkouts(await apiFetch('/api/fitness/workouts'));
    showToast('Workout updated ✓');
  }, [showToast]);

  const deleteWorkout = useCallback(async (id) => {
    await apiFetch('/api/fitness/workouts/' + id, { method: 'DELETE' });
    setWorkouts(prev => prev.filter(w => w.id !== id));
    showToast('Deleted');
  }, [showToast]);

  const addSet = useCallback(async (workoutId, data) => {
    await apiFetch('/api/fitness/workouts/' + workoutId + '/sets', { method: 'POST', body: JSON.stringify(data) });
    setWorkouts(await apiFetch('/api/fitness/workouts'));
  }, []);

  const updateSet = useCallback(async (setId, data) => {
    await apiFetch('/api/fitness/sets/' + setId, { method: 'PUT', body: JSON.stringify(data) });
    setWorkouts(await apiFetch('/api/fitness/workouts'));
  }, []);

  const deleteSet = useCallback(async (setId) => {
    await apiFetch('/api/fitness/sets/' + setId, { method: 'DELETE' });
    setWorkouts(await apiFetch('/api/fitness/workouts'));
  }, []);

  const addMetric = useCallback(async (data) => {
    await apiFetch('/api/fitness/metrics', { method: 'POST', body: JSON.stringify(data) });
    const [m, h] = await Promise.all([
      apiFetch('/api/fitness/metrics'),
      apiFetch('/api/fitness/metrics/history'),
    ]);
    setMetrics(m);
    setHistory(h);
    showToast('Measurement saved ✓');
  }, [showToast]);

  const deleteMetric = useCallback(async (id) => {
    await apiFetch('/api/fitness/metrics/' + id, { method: 'DELETE' });
    const [m, h] = await Promise.all([
      apiFetch('/api/fitness/metrics'),
      apiFetch('/api/fitness/metrics/history'),
    ]);
    setMetrics(m);
    setHistory(h);
    showToast('Deleted');
  }, [showToast]);

  const refreshRuns = useCallback(async () => {
    const [r, rh] = await Promise.all([apiFetch('/api/runs'), apiFetch('/api/runs/history')]);
    setRuns(r);
    setRunHistory(rh);
  }, []);

  const addRun = useCallback(async (data) => {
    await apiFetch('/api/runs', { method: 'POST', body: JSON.stringify(data) });
    await refreshRuns();
    showToast('Run logged ✓');
  }, [refreshRuns, showToast]);

  const updateRun = useCallback(async (id, data) => {
    await apiFetch('/api/runs/' + id, { method: 'PUT', body: JSON.stringify(data) });
    await refreshRuns();
    showToast('Run updated ✓');
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
