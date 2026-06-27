import './Dashboard.css';
import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import { sortByPriority, getAISuggestion } from '../utils/priorityEngine';

export default function Dashboard({ onEditTask }) {
  const { user } = useAuth();
  const { tasks: allTasks, habits, habitLog, setChatOpen, searchQuery, currentWorkspace } = useApp();
  const tasks = allTasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [suggestion, setSuggestion] = useState(() => getAISuggestion(tasks));
  const [tipAnim, setTipAnim] = useState(false);

  const refreshTip = useCallback(() => {
    setTipAnim(true);
    setSuggestion(getAISuggestion(tasks));
    setTimeout(() => setTipAnim(false), 400);
  }, [tasks]);

  const incomplete = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const overdue = incomplete.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  });
  const sortedTasks = sortByPriority(incomplete).slice(0, 5);

  const todayKey = new Date().toISOString().split('T')[0];
  const habitsCompleted = habits.filter(h => habitLog[todayKey]?.[h.id]).length;
  const completionPct = tasks.length > 0 ? Math.round(completed.length / tasks.length * 100) : 0;

  return (
    <div className="page-container animate-fade-in">
      {/* Bento Grid */}
      <div className="bento-grid">

        {/* Stats Card (Span 8) */}
        <div className="glass-card bento-col-7" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: 24, opacity: 0.08 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 96, color: 'var(--primary)', fontVariationSettings: "'FILL' 1" }}>analytics</span>
          </div>
          <h3 className="section-title" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
            Scholarly Progress
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>
                {incomplete.length}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--on-surface-variant)' }}>Active Tasks Pending</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>
                {completed.length}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--on-surface-variant)' }}>Tasks Completed</p>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>
                {completionPct}<span style={{ fontSize: 20, color: 'var(--on-surface-variant)', marginLeft: 2 }}>%</span>
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--on-surface-variant)' }}>Goal Completion</p>
            </div>
          </div>
        </div>

        {/* AI Insight Card (Span 4) */}
        <div style={{
          gridColumn: 'span 4', padding: 32, borderRadius: 'var(--radius-xl)',
          background: 'var(--surface-container-high)', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(109,94,0,0.05) 0%, transparent 100%)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{
              fontFamily: 'var(--font-label)', fontSize: 12, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--tertiary)', marginBottom: 16, fontWeight: 600,
            }}>Priority Insight</h3>
            <p style={{
              fontFamily: 'var(--font-headline)', fontSize: 16, color: 'var(--on-surface)',
              lineHeight: 1.5, opacity: tipAnim ? 0.5 : 1, transition: 'opacity 0.2s',
            }}
              dangerouslySetInnerHTML={{
                __html: `"${suggestion.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}"`,
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, position: 'relative', zIndex: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--tertiary)', fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <button
              onClick={refreshTip}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--on-surface-variant)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
              New Tip
            </button>
            <button
              onClick={() => setChatOpen(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto',
                fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--primary)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Chat with AI <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Left Column (Span 7) */}
        <div className="bento-col-7" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Overdue Tasks */}
          {overdue.length > 0 && (
            <div className="glass-card" style={{ overflow: 'hidden', border: '1px solid var(--error-container)' }}>
              <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(186, 26, 26, 0.05)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>warning</span>
                <h3 className="section-title" style={{ color: 'var(--error)' }}>Overdue Obligations</h3>
              </div>
              <div style={{ height: 1, background: 'var(--error-container)' }} />
              <div style={{ padding: '8px 16px' }}>
                {overdue.map(task => (
                  <TaskCard key={task.id} task={task} onClick={onEditTask} />
                ))}
              </div>
            </div>
          )}

          {/* Immediate Tasks */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <h3 className="section-title">Immediate Tasks</h3>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(195,198,213,0.2), transparent)', margin: '0 24px' }} />
            {sortedTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>check_circle</span>
                </div>
                <p className="empty-state-title">All clear!</p>
                <p className="empty-state-text">No pending tasks. <button onClick={() => setChatOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, textDecoration: 'underline' }}>Ask AI to plan your week</button></p>
              </div>
            ) : (
              <div style={{ padding: '8px 16px' }}>
                {sortedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={onEditTask} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column Widgets (Span 5) */}
        <div className="bento-col-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Productivity Score */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="section-title" style={{ marginBottom: 16 }}>Weekly Synthesis</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {completed.length}
              </span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Tasks Resolved
              </span>
            </div>
            <div className="progress-bar-track" style={{ marginBottom: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--on-surface-variant)', textAlign: 'right' }}>
              {completionPct}% of weekly goal
            </p>
          </div>

          {(!currentWorkspace || currentWorkspace.is_personal) ? (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 className="section-title" style={{ marginBottom: 16 }}>Today's Habits</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {habits.map(h => {
                  const done = habitLog[todayKey]?.[h.id];
                  return (
                    <div key={h.id} style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-full)',
                      background: done ? 'var(--color-success-dim)' : 'var(--surface-container)',
                      border: `1px solid ${done ? 'var(--color-success)' : 'rgba(195,198,213,0.3)'}`,
                      fontSize: 12, fontWeight: 500,
                      fontFamily: 'var(--font-label)',
                      color: done ? 'var(--color-success)' : 'var(--on-surface-variant)',
                    }}>
                      {h.icon} {h.name}
                    </div>
                  );
                })}
                {habits.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>No habits yet</p>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 className="section-title" style={{ marginBottom: 16 }}>Assigned to Me</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tasks.filter(t => !t.completed && (t.assigneeId === user?.id || t.assigneeId === 'everyone' || !t.assigneeId)).length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                    No pending tasks assigned to you.
                  </p>
                ) : (
                  tasks.filter(t => !t.completed && (t.assigneeId === user?.id || t.assigneeId === 'everyone' || !t.assigneeId)).slice(0, 5).map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => onEditTask?.(task)}
                      style={{ 
                        padding: '10px 14px', background: 'var(--surface-container)', 
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        border: '1px solid rgba(195,198,213,0.2)'
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.priority === 'critical' ? 'var(--color-critical)' : task.priority === 'high' ? 'var(--color-high)' : 'var(--color-medium)' }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--on-surface)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recently Completed */}
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px' }}>
              <h3 className="section-title">Recently Completed</h3>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(195,198,213,0.2), transparent)', margin: '0 24px' }} />
            {completed.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 13 }}>
                No completed tasks yet
              </div>
            ) : (
              completed.slice(0, 3).map(task => (
                <div key={task.id} style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-success)' }}>check_circle</span>
                  <span style={{ fontSize: 13, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>{task.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
