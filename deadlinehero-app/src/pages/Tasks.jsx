import './Tasks.css';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import TaskCard from '../components/TaskCard';
import { sortByPriority } from '../utils/priorityEngine';
import { isPast } from 'date-fns';

export default function Tasks({ onEditTask }) {
  const { tasks: allTasks, searchQuery, setChatOpen } = useApp();
  const tasks = allTasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('priority');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const now = new Date();

  // Filters
  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'ongoing') return !t.completed && t.status !== 'done';
    if (filter === 'upcoming') return !t.completed && t.dueDate && new Date(t.dueDate) > now;
    if (filter === 'done') return t.completed || t.status === 'done';
    if (filter === 'overdue') return !t.completed && t.dueDate && isPast(new Date(t.dueDate));
    return true;
  });

  // Sorting
  const sortedTasks = [...filteredTasks];
  if (sort === 'priority') {
    // Sort by priority engine if not completed, else by date
    const incomplete = sortByPriority(sortedTasks.filter(t => !t.completed));
    const complete = sortedTasks.filter(t => t.completed);
    sortedTasks.length = 0;
    sortedTasks.push(...incomplete, ...complete);
  } else if (sort === 'date') {
    sortedTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (sort === 'category') {
    sortedTasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const catA = a.category || 'Uncategorized';
      const catB = b.category || 'Uncategorized';
      return catA.localeCompare(catB);
    });
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const completionPct = tasks.length > 0 ? Math.round(completedCount / tasks.length * 100) : 0;
  
  const highPriorityCount = tasks.filter(t => !t.completed && (t.priority === 'critical' || t.priority === 'high')).length;

  return (
    <div className="page-container animate-fade-in">
      
      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, borderBottom: '1px solid var(--surface-container-high)', paddingBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-label)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, flexWrap: 'wrap' }}>
          {['all', 'ongoing', 'upcoming', 'done', 'overdue'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: filter === f ? (f === 'overdue' ? 'var(--error)' : 'var(--primary)') : 'var(--on-surface-variant)',
                borderBottom: filter === f ? `2px solid ${f === 'overdue' ? 'var(--error)' : 'var(--primary)'}` : '2px solid transparent',
                paddingBottom: 16,
                marginBottom: -18,
                transition: 'all 0.2s'
              }}
            >
              {f === 'all' ? 'All Obligations' : f}
            </button>
          ))}
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', 
              fontSize: 13, color: 'var(--on-surface-variant)', background: sortMenuOpen ? 'var(--surface-container)' : 'none', border: 'none', 
              cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-full)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => { if (!sortMenuOpen) e.currentTarget.style.background = 'var(--surface-container)' }}
            onMouseLeave={e => { if (!sortMenuOpen) e.currentTarget.style.background = 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sort</span>
            <span>Sort by: {sort === 'priority' ? 'Priority' : sort === 'date' ? 'Date' : 'Category'}</span>
          </button>

          {sortMenuOpen && (
            <div 
              className="glass-card animate-fade-in"
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 200, zIndex: 100, padding: 8,
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
              }}
            >
              {[
                { id: 'priority', label: 'Priority (AI Engine)', icon: 'auto_awesome' },
                { id: 'date', label: 'Due Date', icon: 'calendar_today' },
                { id: 'category', label: 'Category (Tags)', icon: 'label' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSort(opt.id);
                    setSortMenuOpen(false);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', background: sort === opt.id ? 'var(--surface-container)' : 'none',
                    border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    color: sort === opt.id ? 'var(--on-surface)' : 'var(--on-surface-variant)',
                    fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'left',
                    fontWeight: sort === opt.id ? 600 : 400
                  }}
                  onMouseEnter={e => { if (sort !== opt.id) e.currentTarget.style.background = 'var(--surface-container-low)' }}
                  onMouseLeave={e => { if (sort !== opt.id) e.currentTarget.style.background = 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bento Layout */}
      <div className="bento-grid">
        
        {/* Main Task Column (Span 8) */}
        <div className="bento-col-8" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sortedTasks.length === 0 ? (
            <div className="empty-state glass-card">
              <div className="empty-state-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>check_circle</span>
              </div>
              <p className="empty-state-title">No pending tasks</p>
              <p className="empty-state-text">Your list is clear. <button onClick={() => setChatOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, textDecoration: 'underline' }}>Ask AI to plan your week</button></p>
            </div>
          ) : (
            sortedTasks.map(task => (
              <div key={task.id} className="glass-card" style={{ padding: '0 8px' }}>
                <TaskCard task={task} onClick={onEditTask} />
              </div>
            ))
          )}
        </div>

        {/* Side Column (Span 4) */}
        <div className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Progress Card */}
          <div className="glass-card" style={{ padding: 24, background: 'var(--surface-container-low)' }}>
            <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 16 }}>
              Weekly Synthesis
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {completedCount}
              </span>
              <span style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Tasks Resolved
              </span>
            </div>
            <div className="progress-bar-track" style={{ marginBottom: 8, height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
            </div>
            <p style={{ fontFamily: 'var(--font-label)', fontSize: 11, color: 'var(--on-surface-variant)', textAlign: 'right' }}>
              {completionPct}% of weekly goal
            </p>
          </div>

          {/* Strategic Focus */}
          <div style={{ 
            padding: 24, borderRadius: 'var(--radius-xl)', 
            background: 'rgba(191, 171, 73, 0.1)', 
            border: '1px solid rgba(191, 171, 73, 0.2)',
            position: 'relative', overflow: 'hidden' 
          }}>
            <span className="material-symbols-outlined" style={{ 
              position: 'absolute', right: -16, top: -16, fontSize: 100, 
              color: 'rgba(109, 94, 0, 0.05)', fontVariationSettings: "'FILL' 1",
              transform: 'rotate(12deg)'
            }}>auto_awesome</span>
            
            <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, fontWeight: 600, color: 'var(--tertiary)', marginBottom: 8, position: 'relative' }}>
              Strategic Focus
            </h4>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--on-tertiary-container)', marginBottom: 16, position: 'relative' }}>
              You have {highPriorityCount} task{highPriorityCount === 1 ? '' : 's'} tagged as 'High Priority' pending. Prioritize deep work sessions.
            </p>
            <button 
              onClick={() => setFilter('ongoing')}
              style={{ 
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 600, color: 'var(--tertiary)',
                display: 'flex', alignItems: 'center', gap: 4, position: 'relative'
              }}
            >
              Review strategy <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
