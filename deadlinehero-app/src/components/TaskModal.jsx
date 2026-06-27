import '../pages/Tasks.css';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getWorkspaceMembers } from '../services/storageService';

const CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Finance'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export default function TaskModal({ task, isNew, onClose, onSave }) {
  const { currentWorkspace } = useApp();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'Work',
    category: 'Work',
    dueDate: '',
    status: 'todo',
    assigneeId: ''
  });

  useEffect(() => {
    if (currentWorkspace && !currentWorkspace.is_personal) {
      getWorkspaceMembers(currentWorkspace.id).then(setMembers);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (task) {
      let localDateStr = '';
      if (task.dueDate) {
        // Format as local datetime string for datetime-local input
        const d = new Date(task.dueDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        localDateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        category: task.category || 'Work',
        category: task.category || 'Work',
        dueDate: localDateStr,
        status: task.status || 'todo',
        assigneeId: task.assigneeId || ''
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate.replace('T', ' ')).toISOString() : null,
    });
    onClose();
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{(task && !isNew) ? 'Edit Obligation' : 'New Obligation'}</h2>
          <button className="btn-ghost btn-icon" onClick={onClose} style={{ padding: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
        
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(195,198,213,0.3), transparent)', margin: '0 24px' }} />

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'none' }}>Title</label>
              <input
                className="form-input"
                type="text"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                style={{ fontSize: 24, fontFamily: 'var(--font-headline)', padding: '12px 0', border: 'none', borderBottom: '1px solid var(--outline-variant)', borderRadius: 0, background: 'transparent' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>subject</span> Description
              </label>
              <textarea
                className="form-input"
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Add details or notes..."
                rows={3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>flag</span> Priority
                </label>
                <select
                  className="form-input"
                  value={form.priority}
                  onChange={e => handleChange('priority', e.target.value)}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>folder</span> Category
                </label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={e => handleChange('category', e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {currentWorkspace && !currentWorkspace.is_personal && (
              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>person</span> Assign To
                </label>
                <select
                  className="form-input"
                  value={form.assigneeId}
                  onChange={e => handleChange('assigneeId', e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Everyone (Unassigned)</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name || m.email || 'Unknown User'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>event</span> Due Date
              </label>
              <input
                className="form-input"
                type="datetime-local"
                value={form.dueDate}
                onChange={e => handleChange('dueDate', e.target.value)}
              />
            </div>

            {(task && !isNew) && (
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>pending_actions</span> Status
                </label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--surface-container-high)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{(task && !isNew) ? 'Save Changes' : 'Create Obligation'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
