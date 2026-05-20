import { createContext, useContext, useState, useCallback } from 'react';
import { apiFetch } from '../utils';

const ClimbingContext = createContext(null);

export function ClimbingProvider({ children }) {
  const [climbs, setClimbs] = useState([]);
  const [toast,  setToast]  = useState('');

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const loadAll = useCallback(async () => {
    const data = await apiFetch('/api/climbing');
    if (!data.error) setClimbs(data);
  }, []);

  const addClimb = useCallback(async (fields, photoFile) => {
    const res = await apiFetch('/api/climbing', { method: 'POST', body: JSON.stringify(fields) });
    if (res.error) { showToast('Error: ' + res.error); return null; }
    if (photoFile) {
      const fd = new FormData();
      fd.append('photo', photoFile);
      await fetch(`/api/climbing/${res.id}/photo`, { method: 'POST', body: fd });
    }
    await loadAll();
    showToast('Climb logged');
    return res.id;
  }, [loadAll]);

  const updateClimb = useCallback(async (id, fields, photoFile) => {
    const res = await apiFetch(`/api/climbing/${id}`, { method: 'PUT', body: JSON.stringify(fields) });
    if (res.error) { showToast('Error: ' + res.error); return; }
    if (photoFile) {
      const fd = new FormData();
      fd.append('photo', photoFile);
      await fetch(`/api/climbing/${id}/photo`, { method: 'POST', body: fd });
    }
    await loadAll();
    showToast('Climb updated');
  }, [loadAll]);

  const deleteClimb = useCallback(async id => {
    await apiFetch(`/api/climbing/${id}`, { method: 'DELETE' });
    await loadAll();
    showToast('Climb deleted');
  }, [loadAll]);

  return (
    <ClimbingContext.Provider value={{ climbs, toast, loadAll, addClimb, updateClimb, deleteClimb }}>
      {children}
    </ClimbingContext.Provider>
  );
}

export function useClimbing() {
  return useContext(ClimbingContext);
}
