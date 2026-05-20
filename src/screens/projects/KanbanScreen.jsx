import { useState } from 'react';
import { useDevProjects } from '../../context/ProjectsContext';
import { KanbanBoard } from './KanbanBoard';

export default function KanbanScreen() {
  const { projects, kanbanTasks, addKanbanTask, updateKanbanTask, deleteKanbanTask } = useDevProjects();
  const [projectFilter, setProjectFilter] = useState('all');

  const filtered = projectFilter === 'all'
    ? kanbanTasks
    : kanbanTasks.filter(t => (t.project_ids || []).includes(Number(projectFilter)));

  const handleMove = async (taskId, newStatus) => {
    const task = kanbanTasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const started_at = newStatus === 'in_progress' && !task.started_at
      ? new Date().toISOString().slice(0, 19)
      : task.started_at;
    await updateKanbanTask(taskId, { ...task, status: newStatus, started_at });
  };

  const handleAdd = async (fields) => {
    await addKanbanTask(fields);
  };

  const inProgress = kanbanTasks.filter(t => t.status === 'in_progress').length;
  const done       = kanbanTasks.filter(t => t.status === 'done').length;

  return (
    <div className="screen">
      <div className="page-header">
        <div>
          <h1>BOARD</h1>
          <p>{kanbanTasks.length} task{kanbanTasks.length !== 1 ? 's' : ''} across {projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div className="climb-stat-box" style={{ minWidth: 80 }}>
            <div className="climb-stat-val">{inProgress}</div>
            <div className="climb-stat-lbl">IN PROGRESS</div>
          </div>
          <div className="climb-stat-box" style={{ minWidth: 80 }}>
            <div className="climb-stat-val">{done}</div>
            <div className="climb-stat-lbl">DONE</div>
          </div>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 20 }}>
        <button className={`chip ${projectFilter === 'all' ? 'active' : 'inactive'}`}
          onClick={() => setProjectFilter('all')}>All Projects</button>
        {projects.map(p => (
          <button key={p.id}
            className={`chip ${projectFilter === String(p.id) ? 'active' : 'inactive'}`}
            onClick={() => setProjectFilter(String(p.id))}>
            {p.name}
          </button>
        ))}
      </div>

      <KanbanBoard
        tasks={filtered}
        projects={projects}
        showProject={projectFilter === 'all'}
        onAdd={handleAdd}
        onUpdate={updateKanbanTask}
        onMove={handleMove}
        onDelete={deleteKanbanTask}
        defaultProjectIds={projectFilter !== 'all' ? [Number(projectFilter)] : []}
      />
    </div>
  );
}
