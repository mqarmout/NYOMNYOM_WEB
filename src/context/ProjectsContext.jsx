import { createContext, useCallback, useContext, useState } from "react";
import { useToast } from "../hooks/useToast";
import { apiFetch } from "../utils";

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [kanbanTasks, setKanbanTasks] = useState([]);
  const [commits, setCommits] = useState({});
  const { toast, showToast } = useToast();

  const loadAll = useCallback(async () => {
    const [proj, tasks] = await Promise.all([
      apiFetch("/api/dev-projects"),
      apiFetch("/api/kanban"),
    ]);
    if (!proj.error) setProjects(proj);
    if (!tasks.error) setKanbanTasks(tasks);
  }, []);

  // ── Projects ──────────────────────────────────────────────────────────────

  const addProject = useCallback(
    async (fields) => {
      const res = await apiFetch("/api/dev-projects", {
        method: "POST",
        body: JSON.stringify(fields),
      });
      if (res.error) {
        showToast("Error: " + res.error);
        return null;
      }
      await loadAll();
      showToast("Project added");
      return res.id;
    },
    [loadAll]
  );

  const updateProject = useCallback(
    async (id, fields) => {
      await apiFetch(`/api/dev-projects/${id}`, { method: "PUT", body: JSON.stringify(fields) });
      await loadAll();
      showToast("Project updated");
    },
    [loadAll]
  );

  const deleteProject = useCallback(async (id) => {
    await apiFetch(`/api/dev-projects/${id}`, { method: "DELETE" });
    setProjects((ps) => ps.filter((p) => p.id !== id));
    setKanbanTasks((ts) => ts.filter((t) => t.project_id !== id));
    showToast("Project deleted");
  }, []);

  const fetchCommit = useCallback(async (projectId) => {
    const res = await apiFetch(`/api/dev-projects/${projectId}/commit`);
    if (!res.error) setCommits((c) => ({ ...c, [projectId]: res }));
    return res;
  }, []);

  // ── Kanban ────────────────────────────────────────────────────────────────

  const addKanbanTask = useCallback(async (fields) => {
    const tempId = -Date.now();
    const tempTask = { id: tempId, status: "backlog", started_at: null, ...fields };
    setKanbanTasks((ts) => [...ts, tempTask]);

    const res = await apiFetch("/api/kanban", { method: "POST", body: JSON.stringify(fields) });
    if (res.error) {
      setKanbanTasks((ts) => ts.filter((t) => t.id !== tempId));
      showToast("Error: " + res.error);
      return null;
    }
    setKanbanTasks((ts) => ts.map((t) => (t.id === tempId ? { ...t, id: res.id } : t)));
    showToast("Task added");
    return res.id;
  }, []);

  const updateKanbanTask = useCallback(async (taskId, fields) => {
    await apiFetch(`/api/kanban/${taskId}`, { method: "PUT", body: JSON.stringify(fields) });
    setKanbanTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, ...fields } : t)));
  }, []);

  const deleteKanbanTask = useCallback(async (taskId) => {
    await apiFetch(`/api/kanban/${taskId}`, { method: "DELETE" });
    setKanbanTasks((ts) => ts.filter((t) => t.id !== taskId));
    showToast("Task deleted");
  }, []);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        kanbanTasks,
        commits,
        toast,
        loadAll,
        addProject,
        updateProject,
        deleteProject,
        fetchCommit,
        addKanbanTask,
        updateKanbanTask,
        deleteKanbanTask,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useDevProjects() {
  return useContext(ProjectsContext);
}
