import '../pages/Goals.css';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function HabitTracker() {
  const { habits, habitLog, toggleHabitDay, getHabitStreak, addHabit, deleteHabit } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('✅');

  const todayKey = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit({ name: newName, icon: newIcon });
    setNewName('');
    setNewIcon('✅');
    setShowAdd(false);
  };

  // Build contribution grid data (last 28 days)
  const contributionDays = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    const completedCount = habits.filter(h => habitLog[key]?.[h.id]).length;
    const ratio = habits.length > 0 ? completedCount / habits.length : 0;
    contributionDays.push({ key, ratio, date: d });
  }

  const ICONS = ['✅', '🏃', '📚', '🧘', '💧', '💪', '🎯', '✍️', '🎵', '🧹'];

  return (
    <div className="bento-grid">
      
      {/* Contribution Grid (Span 4) */}
      <div className="glass-card" style={{ gridColumn: 'span 4', padding: 24 }}>
        <h3 className="section-title">Activity Overview</h3>
        <p className="section-subtitle" style={{ marginBottom: 24 }}>Daily completion rate across all habits</p>
        
        <div className="habit-grid">
          {contributionDays.map(d => (
            <div
              key={d.key}
              className={`habit-cell ${d.ratio >= 0.75 ? 'active' : d.ratio > 0 ? 'partial' : ''}`}
              title={`${d.date.toLocaleDateString()} — ${Math.round(d.ratio * 100)}% complete`}
            />
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 11, fontFamily: 'var(--font-label)', color: 'var(--on-surface-variant)' }}>
          <span>28 days ago</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>Less</span>
            <div className="habit-cell" style={{ width: 12, height: 12, borderRadius: 2, cursor: 'default' }} title="0% completed" />
            <div className="habit-cell partial" style={{ width: 12, height: 12, borderRadius: 2, cursor: 'default' }} title="1% to 74% completed" />
            <div className="habit-cell active" style={{ width: 12, height: 12, borderRadius: 2, cursor: 'default' }} title="75% to 100% completed" />
            <span>More</span>
          </div>
          <span>Today</span>
        </div>
      </div>

      {/* Today's Habits (Span 8) */}
      <div className="glass-card" style={{ gridColumn: 'span 8', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="section-title">Today's Habits</h3>
            <p className="section-subtitle">
              {habits.filter(h => habitLog[todayKey]?.[h.id]).length} of {habits.length} habits completed today
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(!showAdd)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Habit
          </button>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(195,198,213,0.2), transparent)', margin: '0 24px' }} />

        {showAdd && (
          <div style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center', background: 'var(--surface-container-lowest)' }}>
            <select
              className="form-input"
              value={newIcon}
              onChange={e => setNewIcon(e.target.value)}
              style={{ width: 70, padding: '8px', fontSize: 18 }}
            >
              {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <input
              className="form-input"
              type="text"
              placeholder="E.g., Read for 30 minutes..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1 }}
              autoFocus
            />
            <button className="btn btn-primary" onClick={handleAdd}>Save</button>
            <button className="btn-ghost btn-icon" onClick={() => setShowAdd(false)} style={{ flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        )}

        {habits.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>self_improvement</span>
            </div>
            <p className="empty-state-title">No habits yet</p>
            <p className="empty-state-text">Start building positive routines.</p>
          </div>
        ) : (
          <div className="bento-col-8" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {habits.map(habit => {
              const isDone = habitLog[todayKey]?.[habit.id] || false;
              const streak = getHabitStreak(habit.id);

              return (
                <div key={habit.id} className="habit-item group" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
                  <button
                    className={`task-card-checkbox ${isDone ? 'checked' : ''}`}
                    onClick={() => toggleHabitDay(habit.id, todayKey)}
                    style={{ flexShrink: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: isDone ? 'var(--on-primary)' : 'transparent', fontVariationSettings: "'FILL' 1" }}>check</span>
                  </button>
                  
                  <span style={{ fontSize: 24 }}>{habit.icon}</span>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500,
                      color: isDone ? 'var(--on-surface-variant)' : 'var(--on-surface)',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {habit.name}
                    </p>
                  </div>
                  
                  {streak > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(191, 171, 73, 0.1)', color: 'var(--tertiary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-label)', fontSize: 12, fontWeight: 600 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                      {streak} day streak
                    </div>
                  )}
                  
                  <button
                    className="btn-ghost btn-icon"
                    onClick={() => deleteHabit(habit.id)}
                    style={{ opacity: 0, transition: 'opacity 0.2s', flexShrink: 0 }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                    aria-label="Delete habit"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>

                  <style>{`
                    .habit-item:hover .btn-icon { opacity: 0.5 !important; }
                    .habit-item .btn-icon:hover { opacity: 1 !important; color: var(--error); }
                  `}</style>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
