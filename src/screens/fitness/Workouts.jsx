import { useState, useEffect, useRef } from 'react';
import { useFitness } from '../../context/FitnessContext';
import { fmtDate } from '../../utils';
import { IClose, IChevDown, IChevUp } from '../../icons';

function SetRow({ s, onDelete }) {
  const parts = [];
  if (s.sets && s.reps)   parts.push(`${s.sets}×${s.reps}`);
  if (s.weight)           parts.push(`${s.weight} lbs`);
  if (s.duration)         parts.push(`${Math.round(s.duration / 60)} min`);
  return (
    <div className="set-row">
      <span className="set-exercise">{s.exercise}</span>
      <span className="set-details">{parts.join(' · ')}</span>
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

  const handleAdd = async () => {
    if (!exercise.trim()) return;
    await onAdd(workoutId, {
      exercise: exercise.trim(),
      sets:     sets     ? parseInt(sets)       : null,
      reps:     reps     ? parseInt(reps)       : null,
      weight:   weight   ? parseFloat(weight)   : null,
      duration: duration ? parseInt(duration) * 60 : null,
    });
    setExercise(''); setSets(''); setReps(''); setWeight(''); setDuration('');
  };

  return (
    <div className="add-set-form">
      <input type="text" placeholder="Exercise name" value={exercise} onChange={e => setExercise(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()} className="set-input" />
      <input type="number" placeholder="Sets" min="1" value={sets} onChange={e => setSets(e.target.value)} className="set-input-sm" />
      <input type="number" placeholder="Reps" min="1" value={reps} onChange={e => setReps(e.target.value)} className="set-input-sm" />
      <input type="number" placeholder="lbs" min="0" step="0.5" value={weight} onChange={e => setWeight(e.target.value)} className="set-input-sm" />
      <input type="number" placeholder="min" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="set-input-sm" />
      <button className="set-add-btn" onClick={handleAdd} disabled={!exercise.trim()}>+</button>
      <button className="set-done-btn" onClick={onDone}>Done</button>
    </div>
  );
}

function WorkoutModal({ onSave, onClose }) {
  const [name,  setName]  = useState('');
  const [date,  setDate]  = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSave = () => { if (name.trim()) onSave({ name: name.trim(), date, notes: notes.trim() || null }); };
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
          <div className="modal-title">Log Workout</div>
          <button className="close-btn" onClick={onClose}><IClose /></button>
        </div>
        <div className="field">
          <label>Workout Name</label>
          <input type="text" placeholder="e.g. Upper Body, Morning Run" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <input type="text" placeholder="Any notes..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button className="modal-save-btn" onClick={handleSave} disabled={!name.trim()}>
          Create Workout
        </button>
      </div>
    </div>
  );
}

export default function Workouts() {
  const { workouts, loadAll, addWorkout, deleteWorkout, addSet, deleteSet } = useFitness();
  const [showModal, setShowModal]   = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [addingTo, setAddingTo]     = useState(null);

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
                  <div className="workout-meta">{fmtDate(w.date)} · {w.sets.length} exercise{w.sets.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="workout-header-right">
                  <span className="workout-chevron">{expanded === w.id ? <IChevUp /> : <IChevDown />}</span>
                  <button className="tx-delete" onClick={e => { e.stopPropagation(); deleteWorkout(w.id); }}><IClose /></button>
                </div>
              </div>

              {expanded === w.id && (
                <div className="workout-body">
                  {w.sets.length === 0 && addingTo !== w.id && (
                    <div className="workout-empty">No exercises yet.</div>
                  )}
                  {w.sets.map(s => <SetRow key={s.id} s={s} onDelete={deleteSet} />)}
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
    </div>
  );
}
