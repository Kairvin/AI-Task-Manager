import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { isPast, differenceInHours, format } from 'date-fns';

const pageTitles = {
  '/dashboard': 'Today at a Glance',
  '/tasks': 'Curated Tasks',
  '/calendar': 'Calendar',
  '/goals': 'Strategic Milestones',
};

const pageSubtitles = {
  '/dashboard': 'Your focus and scholarly progress for the day.',
  '/tasks': 'Organize, prioritize, and execute with clarity.',
  '/calendar': 'A view of forthcoming engagements.',
  '/goals': 'Track consistent growth over time.',
};

export default function TopBar({ onNewTask }) {
  const location = useLocation();
  const { tasks, setChatOpen, chatOpen, searchQuery, setSearchQuery } = useApp();
  const { user } = useAuth();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const [alertOpen, setAlertOpen] = useState(false);
  const alertRef = useRef(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const subtitle = pageSubtitles[location.pathname]
    ? `${dateStr}. ${pageSubtitles[location.pathname]}`
    : dateStr;

  // Compute alerts
  const incomplete = tasks.filter(t => !t.completed);
  const overdue = incomplete.filter(t => t.dueDate && isPast(new Date(t.dueDate)));
  const dueSoon = incomplete.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    const hours = differenceInHours(d, now);
    return hours > 0 && hours <= 24;
  });
  const alertCount = overdue.length + dueSoon.length;

  useEffect(() => {
    const handleClick = (e) => {
      if (alertRef.current && !alertRef.current.contains(e.target)) {
        setAlertOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        <p className="topbar-subtitle">{subtitle}</p>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--outline)' }}>search</span>
          <input 
            type="text" 
            placeholder={location.pathname === '/goals' ? 'Search goals...' : 'Search tasks...'} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {location.pathname === '/goals' ? (
          <button className="btn btn-primary btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('open-goal-modal'))}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            New Goal
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onNewTask}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            New Task
          </button>
        )}

        {/* Alerts Dropdown */}
        <div ref={alertRef} style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            title="Task Alerts"
            onClick={() => setAlertOpen(!alertOpen)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
            {alertCount > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--error)',
                border: '2px solid var(--surface-container-lowest)',
              }} />
            )}
          </button>

          {alertOpen && (
            <div className="glass-card" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 340, zIndex: 100, padding: 0, overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              animation: 'fadeSlideDown 0.2s ease',
            }}>
              <div style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'relative',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-headline)' }}>Task Alerts</h4>
                <button className="btn-ghost btn-icon" onClick={() => setAlertOpen(false)} style={{ padding: 2, border: 'none', background: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>
              <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(195,198,213,0.3), transparent)', margin: '0 16px' }} />

              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {alertCount === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                    ✨ No alerts — you're on top of things!
                  </div>
                ) : (
                  <>
                    {overdue.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-label)' }}>
                          Overdue ({overdue.length})
                        </div>
                        {overdue.map(task => (
                          <div key={task.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--error)', marginTop: 2 }}>warning</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                              <p style={{ fontSize: '11px', color: 'var(--error)', marginTop: 2 }}>
                                Was due {task.dueDate ? format(new Date(task.dueDate), 'MMM d, h:mm a') : 'No date'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {dueSoon.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-label)' }}>
                          Due Soon ({dueSoon.length})
                        </div>
                        {dueSoon.map(task => {
                          const hours = differenceInHours(new Date(task.dueDate), now);
                          return (
                            <div key={task.id} style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-warning)', marginTop: 2 }}>schedule</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                                <p style={{ fontSize: '11px', color: 'var(--color-warning)', marginTop: 2 }}>
                                  Due in {hours <= 1 ? 'less than an hour' : `${hours}h`} — {format(new Date(task.dueDate), 'h:mm a')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          className="icon-btn"
          title="AI Assistant"
          onClick={() => setChatOpen(!chatOpen)}
          style={chatOpen ? { background: 'var(--primary-fixed)', borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
        </button>
      </div>
    </header>
  );
}
