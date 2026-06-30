import './Goals.css';
import { useApp } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';

export default function Goals() {
  const { habits, habitLog, toggleHabitDay, addHabit, deleteHabit, searchQuery, currentWorkspace } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowAdd(true);
    window.addEventListener('open-goal-modal', handleOpen);
    return () => window.removeEventListener('open-goal-modal', handleOpen);
  }, []);

  const filteredHabits = habits.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (h.desc && h.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const todayKey = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit({ name: newName, desc: newDesc, icon: '🎯' });
    setNewName('');
    setNewDesc('');
    setShowAdd(false);
  };

  // Build the green Annual Progression Graph
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today.getTime() - 364 * 86400000);
  const dayOfWeek = startDate.getDay();
  const offsetDate = new Date(startDate.getTime() - dayOfWeek * 86400000);
  const totalDays = 364 + dayOfWeek + (6 - today.getDay()) + 1;
  
  const contributionDays = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(offsetDate.getTime() + i * 86400000);
    const key = d.toISOString().split('T')[0];
    
    let completedCount = 0;
    if (habitLog[key]) {
      completedCount = habits.filter(h => habitLog[key][h.id]).length;
    }
    const ratio = habits.length > 0 ? completedCount / habits.length : 0;
    
    let level = 0;
    if (ratio > 0) level = 1;
    if (ratio >= 0.5) level = 2;
    if (ratio >= 1.0) level = 3;

    contributionDays.push({ key, date: d, level, ratio });
  }

  const weeks = [];
  for (let i = 0; i < contributionDays.length; i += 7) {
    weeks.push(contributionDays.slice(i, i + 7));
  }

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const displayMonths = monthLabels.slice(new Date().getMonth() + 1).concat(monthLabels.slice(0, new Date().getMonth() + 1));

  if (currentWorkspace && !currentWorkspace.is_personal) {
    return (
      <div className="page-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>group_off</span>
          </div>
          <p className="empty-state-title">Personal Feature</p>
          <p className="empty-state-text">Habits and Goals are only available in Personal Workspaces.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="goals-page animate-fade-in">
      <div className="goals-header">
        <h1 className="goals-title">Strategic Milestones</h1>
        <p className="goals-subtitle">
          A comprehensive overview of your scholarly pursuits and long-term aspirations, tracking consistent intellectual growth over time.
        </p>
      </div>

      <div className="annual-progression">
        <h2 className="section-heading">Annual Progression</h2>
        <p className="section-subheading">Scholarly activity density over the past 12 months</p>
        
        <div className="graph-container">
          <div className="graph-scroll-wrapper">
            <div className="graph-weeks">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="graph-week">
                  {week.map((day) => (
                    <div
                      key={day.key}
                      className={`graph-day level-${day.level}`}
                      title={`${day.date.toLocaleDateString()} — ${Math.round(day.ratio * 100)}% complete`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="graph-months">
              {displayMonths.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="goals-layout">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>Long-term Aspirations</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} /> Add a Goal
            </button>
          </div>

          {showAdd && (
            <div className="aspiration-card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                <input
                  className="form-input"
                  placeholder="New Goal Title..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-container-highest)', border: 'none', borderRadius: 'var(--radius-md)' }}
                />
                <textarea
                  className="form-input"
                  placeholder="Goal Description..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-container-highest)', border: 'none', borderRadius: 'var(--radius-md)', resize: 'none', height: 80 }}
                />
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleAdd}>Save Goal</button>
                </div>
              </div>
            </div>
          )}

        <div className="aspirations-list">
          {filteredHabits.length === 0 ? (
            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline)', marginBottom: 16 }}>target</span>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, color: 'var(--on-surface)', marginBottom: 8 }}>No goals found</h3>
              <p style={{ color: 'var(--on-surface-variant)' }}>Create a new strategic milestone to start tracking your progress.</p>
            </div>
          ) : (
            filteredHabits.map(habit => {
              const totalCompleted = Object.values(habitLog).filter(dayLog => dayLog[habit.id]).length;
              const target = 100;
              const progressPct = Math.min(Math.round((totalCompleted / target) * 100), 100);
              const isDoneToday = habitLog[todayKey]?.[habit.id] || false;

              return (
                <div key={habit.id} className="aspiration-card">
                  <div className="aspiration-card-header">
                    <div className="aspiration-icon">{habit.icon || '🎯'}</div>
                    <div className={`aspiration-tag ${progressPct > 0 ? 'active' : ''}`}>
                      {progressPct > 0 ? 'In Progress' : 'Planning'}
                    </div>
                  </div>
                  <h3 className="aspiration-title">{habit.name}</h3>
                  <p className="aspiration-desc">{habit.desc || 'Consistently make progress towards this goal.'}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 8 }}>
                    <button 
                      className={`btn btn-sm ${habitLog[todayKey]?.[habit.id] ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => toggleHabitDay(habit.id, todayKey)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto', justifyContent: 'center' }}
                    >
                      <CheckCircle2 size={16} /> {habitLog[todayKey]?.[habit.id] ? 'Completed Today' : 'Mark as Done'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteHabit(habit.id)} style={{ color: 'var(--error)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
            
          {habits.length === 0 && !showAdd && (
              <div className="aspiration-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '48px 24px', cursor: 'pointer', border: '1px dashed var(--outline-variant)', background: 'transparent' }} onClick={() => setShowAdd(true)}>
                <Plus size={32} style={{ color: 'var(--outline)', marginBottom: 12 }} />
                <p style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>Create New Aspiration</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="section-heading" style={{ marginBottom: 24 }}>Today's Milestones</h2>
          
          <div className="timeline">
            {habits.length === 0 ? (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>No milestones for today. Create an aspiration to get started.</p>
            ) : (
              habits.map((habit) => {
                const isDone = habitLog[todayKey]?.[habit.id] || false;
                
                return (
                  <div key={habit.id} className="timeline-item">
                    <div 
                      className={`timeline-node ${isDone ? 'completed' : ''}`}
                      onClick={() => toggleHabitDay(habit.id, todayKey)}
                    >
                      {isDone && <CheckCircle2 size={12} />}
                    </div>
                    <div className="timeline-content">
                      <div className={`timeline-status ${isDone ? 'active' : ''}`}>
                        {isDone ? 'Achieved' : 'Current Focus'}
                      </div>
                      <h4 className={`timeline-title ${isDone ? 'completed' : ''}`}>
                        {habit.name}
                      </h4>
                      <p className="timeline-desc">
                        {isDone ? 'Completed primary objective for today.' : 'Click the node to mark this goal as progressed today.'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
