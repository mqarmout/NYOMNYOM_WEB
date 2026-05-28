import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { apiFetch } from '../utils';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [projects,   setProjects]   = useState([]);
  const [skills,     setSkills]     = useState([]);
  const [experience, setExperience] = useState([]);
  const [about,      setAbout]      = useState({
    display_name: '', headline: '', bio: '', location: '', website: '', github: '', linkedin: '',
  });
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const loadAll = useCallback(async () => {
    const [p, s, e, a] = await Promise.all([
      apiFetch('/api/portfolio/projects'),
      apiFetch('/api/portfolio/skills'),
      apiFetch('/api/portfolio/experience'),
      apiFetch('/api/portfolio/about'),
    ]);
    if (!p.error) setProjects(p);
    if (!s.error) setSkills(s);
    if (!e.error) setExperience(e);
    if (!a.error) setAbout(a);
  }, []);

  const addProject = useCallback(async (data) => {
    await apiFetch('/api/portfolio/projects', { method: 'POST', body: JSON.stringify(data) });
    setProjects(await apiFetch('/api/portfolio/projects'));
    showToast('Project added ✓');
  }, [showToast]);

  const updateProject = useCallback(async (id, data) => {
    await apiFetch('/api/portfolio/projects/' + id, { method: 'PUT', body: JSON.stringify(data) });
    setProjects(await apiFetch('/api/portfolio/projects'));
    showToast('Project updated ✓');
  }, [showToast]);

  const deleteProject = useCallback(async (id) => {
    await apiFetch('/api/portfolio/projects/' + id, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
    showToast('Deleted');
  }, [showToast]);

  const addSkill = useCallback(async (data) => {
    await apiFetch('/api/portfolio/skills', { method: 'POST', body: JSON.stringify(data) });
    setSkills(await apiFetch('/api/portfolio/skills'));
  }, []);

  const updateSkill = useCallback(async (id, data) => {
    await apiFetch('/api/portfolio/skills/' + id, { method: 'PUT', body: JSON.stringify(data) });
    setSkills(await apiFetch('/api/portfolio/skills'));
  }, []);

  const deleteSkill = useCallback(async (id) => {
    await apiFetch('/api/portfolio/skills/' + id, { method: 'DELETE' });
    setSkills(prev => prev.filter(s => s.id !== id));
  }, []);

  const addExperience = useCallback(async (data) => {
    await apiFetch('/api/portfolio/experience', { method: 'POST', body: JSON.stringify(data) });
    setExperience(await apiFetch('/api/portfolio/experience'));
    showToast('Experience added ✓');
  }, [showToast]);

  const updateExperience = useCallback(async (id, data) => {
    await apiFetch('/api/portfolio/experience/' + id, { method: 'PUT', body: JSON.stringify(data) });
    setExperience(await apiFetch('/api/portfolio/experience'));
    showToast('Updated ✓');
  }, [showToast]);

  const deleteExperience = useCallback(async (id) => {
    await apiFetch('/api/portfolio/experience/' + id, { method: 'DELETE' });
    setExperience(prev => prev.filter(e => e.id !== id));
    showToast('Deleted');
  }, [showToast]);

  const saveAbout = useCallback(async (data) => {
    await apiFetch('/api/portfolio/about', { method: 'POST', body: JSON.stringify(data) });
    setAbout(prev => ({ ...prev, ...data }));
    showToast('Saved ✓');
  }, [showToast]);

  return (
    <PortfolioContext.Provider value={{
      projects, skills, experience, about, toast,
      loadAll,
      addProject, updateProject, deleteProject,
      addSkill, updateSkill, deleteSkill,
      addExperience, updateExperience, deleteExperience,
      saveAbout, showToast,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
