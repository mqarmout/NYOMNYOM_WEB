import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../utils';

const FitnessContext = createContext(null);

export function FitnessProvider({ children }) {
  const [workouts, setWorkouts] = useState([]);
  const [metrics,  setMetrics]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [toast,    setToast]    = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const loadAll = useCallback(async () => {
    const [w, m, h] = await Promise.all([
      apiFetch('/api/fitness/workouts'),
      apiFetch('/api/fitness/metrics'),
      apiFetch('/api/fitness/metrics/history'),
    ]);
    setWorkouts(w);
    setMetrics(m);
    setHistory(h);
  }, []);

  const addWorkout = useCallback(async (data) => {
    const res = await apiFetch('/api/fitness/workouts', { method: 'POST', body: JSON.stringify(data) });
    setWorkouts(await apiFetch('/api/fitness/workouts'));
    showToast('Workout logged ✓');
    return res.id;
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

  return (
    <FitnessContext.Provider value={{
      workouts, metrics, history, toast,
      loadAll, addWorkout, deleteWorkout, addSet, deleteSet,
      addMetric, deleteMetric, showToast,
    }}>
      {children}
    </FitnessContext.Provider>
  );
}

export const useFitness = () => useContext(FitnessContext);
