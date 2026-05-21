import { useState, useEffect, useRef } from 'react';
import { useFitness } from '../../context/FitnessContext';
import { fmtDate } from '../../utils';
import { IClose, IEdit, IChevDown, IChevUp } from '../../icons';

function SetRow({ s, onDelete, onUpdate }) {
  const [editing,  setEditing]  = useState(false);
  const [exercise, setExercise] = useState(s.exercise);
  const [sets,     setSets]     = useState(s.sets ?? '');
  const [reps,     setReps]     = useState(s.reps ?? '');
  const [weight,   setWeight]   = useState(s.weight ?? '');
  const [duration, setDuration] = useState(s.duration ?? '');

  const handleSave = async () => {
    if (!exercise.trim()) return;
    await onUpdate(s.id, {
      exercise: exercise.trim(),
      sets:     sets     ? parseInt(sets)     : null,
      reps:     reps     ? parseInt(reps)     : null,
      weight:   weight   ? parseFloat(weight) : null,
      duration: duration ? parseInt(duration) : null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="set-row set-row-editing">
        <input type="text" value={exercise} onChange={e => setExercise(e.target.value)}
          className="set-input" onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
        <input type="number" placeholder="Sets" min="1" value={sets} onChange={e => setSets(e.target.value)} className="set-input-sm" />
        <input type="number" placeholder="Reps" min="1" value={reps} onChange={e => setReps(e.target.value)} className="set-input-sm" />
        <input type="number" placeholder="lbs" min="0" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} className="set-input-sm" />
        <input type="number" placeholder="sec" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="set-input-sm" />
        <button className="set-add-btn" onClick={handleSave} disabled={!exercise.trim()}>✓</button>
        <button className="set-done-btn" onClick={() => setEditing(false)}>✕</button>
      </div>
    );
  }

  const parts = [];
  if (s.sets && s.reps)   parts.push(`${s.sets}×${s.reps}`);
  else if (s.sets)        parts.push(`${s.sets} sets`);
  else if (s.reps)        parts.push(`${s.reps} reps`);
  if (s.weight)           parts.push(`${s.weight} lbs`);
  if (s.duration)         parts.push(`${s.duration}s`);
  return (
    <div className="set-row">
      <span className="set-exercise">{s.exercise}</span>
      <span className="set-details">{parts.join(' · ')}</span>
      <button className="tx-delete" onClick={() => setEditing(true)}><IEdit /></button>
      <button className="tx-delete" onClick={() => onDelete(s.id)}><IClose /></button>
    </div>
  );
}

function AddSetForm({ workoutId, onAdd, onDone }) {
  const [exercise, setExercise] = useState('');
  const [sets,     setSets]     = useState('');
  const [reps,     setReps]     = useState('');
  const [weight,   setWeight]   = useState('');
  const [duration, setDuration] = useState('');
  const exerciseRef = useRef(null);

  useEffect(() => { exerciseRef.current?.focus(); }, []);

  const handleAdd = async () => {
    if (!exercise.trim()) return;
    await onAdd(workoutId, {
      exercise: exercise.trim(),
      sets:     sets     ? parseInt(sets)     : null,
      reps:     reps     ? parseInt(reps)     : null,
      weight:   weight   ? parseFloat(weight) : null,
      duration: duration ? parseInt(duration) : null,
    });
    setExercise(''); setSets(''); setReps(''); setWeight(''); setDuration('');
    exerciseRef.current?.focus();
  };

  return (
    <div className="add-set-form">
      <input ref={exerciseRef} type="text" placeholder="Exercise name" value={exercise}
        onChange={e => setExercise(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()} className="set-input" />
      <input type="number" placeholder="Sets" min="1" value={sets} onChange={e => setSets(e.target.value)} className="set-input-sm" />
      <input type="number" placeholder="Reps" min="1" value={reps} onChange={e => setReps(e.target.value)} className="set-input-sm" />
      <input type="number" placeholder="lbs" min="0" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} className="set-input-sm" />
      <input type="number" placeholder="sec" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="set-input-sm" />
      <button className="set-add-btn" onClick={handleAdd} disabled={!exercise.trim()}>+</button>
      <button className="set-done-btn" onClick={onDone}>Done</button>
    </div>
  );
}

function WorkoutModal({ initial, onSave, onClose }) {
  const [name,     setName]     = useState(initial?.name  ?? '');
  const [date,     setDate]     = useState(initial?.date  ?? new Date().toISOString().split('T')[0]);
  const [notes,    setNotes]    = useState(initial?.notes ?? '');
  const [duration, setDuration] = useState(initial?.duration ?? '');

  const isEdit = !!initial;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name:     name.trim(),
      date,
      notes:    notes.trim() || null,
      duration: duration ? parseInt(duration) : null,
    });
  };
  const saveRef = useRef(null);
  saveRef.current = handleSave;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter' && !['TEXTAREA', 'SELECT', 'BUTTON'].includes(e.target.tagName)) {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Workout' : 'Log Workout'}</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div className="field">
          <label>Workout Name</label>
          <input type="text" placeholder="e.g. Upper Body, Morning Run" value={name}
            onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Duration (minutes, optional)</label>
          <input type="number" placeholder="e.g. 45" min="1" value={duration}
            onChange={e => setDuration(e.target.value)} />
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <input type="text" placeholder="Any notes..." value={notes}
            onChange={e => setNotes(e.target.value)} />
        </div>
        <button className="modal-save-btn" onClick={handleSave} disabled={!name.trim()}>
          {isEdit ? 'Save Changes' : 'Create Workout'}
        </button>
      </div>
    </div>
  );
}

export default function Workouts() {
  const { workouts, loadAll, addWorkout, updateWorkout, deleteWorkout, addSet, updateSet, deleteSet } = useFitness();
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [expanded,  setExpanded]  = useState(null);
  const [addingTo,  setAddingTo]  = useState(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener('shortcut:new', handler);
    return () => window.removeEventListener('shortcut:new', handler);
  }, []);

  const handleCreate = async (data) => {
    const id = await addWorkout(data);
    setShowModal(false);
    setExpanded(id);
    setAddingTo(id);
  };

  const handleUpdate = async (data) => {
    await updateWorkout(editing.id, data);
    setEditing(null);
  };

  const fmtDuration = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="screen">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Workouts</h1>
          <p>{workouts.length} session{workouts.length !== 1 ? 's' : ''} logged</p>
        </div>
        <button className="sidebar-add-btn" style={{ width: 'auto', padding: '10px 20px', marginTop: 4 }}
          onClick={() => setShowModal(true)}>+ Log Workout</button>
      </div>

      {workouts.length === 0 ? (
        <div className="empty-state">No workouts logged yet.<br />Click <strong>+ Log Workout</strong> to get started.</div>
      ) : (
        <div className="workout-list">
          {workouts.map(w => (
            <div className="workout-item" key={w.id}>
              <div className="workout-header" onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
                <div className="workout-header-left">
                  <div className="workout-name">{w.name}</div>
                  <div className="workout-meta">
                    {fmtDate(w.date)}
                    {w.duration ? ` · ${fmtDuration(w.duration)}` : ''}
                    {' · '}{w.sets.length} exercise{w.sets.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="workout-header-right">
                  <span className="workout-chevron">{expanded === w.id ? <IChevUp /> : <IChevDown />}</span>
                  <button className="tx-delete" onClick={e => { e.stopPropagation(); setEditing(w); }}><IEdit /></button>
                  <button className="tx-delete" onClick={e => { e.stopPropagation(); deleteWorkout(w.id); }}><IClose /></button>
                </div>
              </div>

              {expanded === w.id && (
                <div className="workout-body">
                  {w.sets.length === 0 && addingTo !== w.id && (
                    <div className="workout-empty">No exercises yet.</div>
                  )}
                  {w.sets.map(s => <SetRow key={s.id} s={s} onDelete={deleteSet} onUpdate={updateSet} />)}
                  {addingTo === w.id ? (
                    <AddSetForm workoutId={w.id} onAdd={addSet} onDone={() => setAddingTo(null)} />
                  ) : (
                    <button className="add-set-trigger" onClick={() => setAddingTo(w.id)}>+ Add Exercise</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <WorkoutModal onSave={handleCreate} onClose={() => setShowModal(false)} />}
      {editing   && <WorkoutModal initial={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />}
    </div>
  );
}
