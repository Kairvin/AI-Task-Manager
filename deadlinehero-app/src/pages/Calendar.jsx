import './Calendar.css';
import { useState } from 'react';
import CalendarView from '../components/CalendarView';
import { useApp } from '../context/AppContext';
import { isSameDay, format, MONTHS, addMonths, subMonths, addWeeks, subWeeks } from '../utils/dateUtils';

export default function Calendar({ onEditTask, onNewTask }) {
  const { tasks } = useApp();
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');

  const selectedDayTasks = selectedDay
    ? tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), selectedDay))
    : [];

  const upcomingTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date() && !t.completed).slice(0, 3);

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', gap: 40 }}>
      {/* Main Calendar Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, borderBottom: '1px solid var(--surface-container-high)', paddingBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 36, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', background: 'var(--surface-container-low)', padding: 4, borderRadius: 'var(--radius-lg)' }}>
              <button onClick={() => setViewMode('month')} style={{ padding: '8px 16px', fontSize: 14, fontFamily: 'var(--font-label)', borderRadius: 'var(--radius-sm)', background: viewMode === 'month' ? 'var(--surface-container-lowest)' : 'transparent', color: viewMode === 'month' ? 'var(--on-surface)' : 'var(--on-surface-variant)', boxShadow: viewMode === 'month' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer' }}>Month</button>
              <button onClick={() => setViewMode('week')} style={{ padding: '8px 16px', fontSize: 14, fontFamily: 'var(--font-label)', borderRadius: 'var(--radius-sm)', background: viewMode === 'week' ? 'var(--surface-container-lowest)' : 'transparent', color: viewMode === 'week' ? 'var(--on-surface)' : 'var(--on-surface-variant)', boxShadow: viewMode === 'week' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', border: 'none', cursor: 'pointer' }}>Week</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="icon-btn" onClick={() => setCurrentDate(prev => viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1))}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="icon-btn" onClick={() => setCurrentDate(prev => viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1))}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </header>

        {/* Grid */}
        <CalendarView onDayClick={setSelectedDay} currentDate={currentDate} viewMode={viewMode} />
      </div>

      {/* Quick Schedule Sidebar */}
      <aside style={{ width: 384, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {selectedDay ? (
          <div className="glass-card" style={{ padding: 24, background: 'var(--surface-container-low)' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, color: 'var(--on-surface)', marginBottom: 24, borderBottom: '1px solid rgba(195,198,213,0.2)', paddingBottom: 12 }}>
              {format(selectedDay, 'EEEE, MMM d')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedDayTasks.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', textAlign: 'center', padding: '20px 0' }}>No tasks scheduled.</p>
              ) : (
                selectedDayTasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => onEditTask(task)}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--surface-container-lowest)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(195,198,213,0.3)' }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-label)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>{format(selectedDay, 'MMM')}</span>
                      <span style={{ fontSize: 18, fontFamily: 'var(--font-headline)', color: 'var(--on-surface)', lineHeight: 1 }}>{format(selectedDay, 'd')}</span>
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--on-surface)', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</h4>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                        {task.dueDate ? format(new Date(task.dueDate), 'h:mm a') : 'All day'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-outline" onClick={() => {
              const d = new Date(selectedDay);
              d.setHours(12, 0, 0, 0); // Default to noon
              onNewTask({ dueDate: d.toISOString() });
            }} style={{ width: '100%', marginTop: 24 }}>
              Add Task for Date
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 24, background: 'var(--surface-container-low)' }}>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 18, color: 'var(--on-surface)', marginBottom: 24, borderBottom: '1px solid rgba(195,198,213,0.2)', paddingBottom: 12 }}>
              Upcoming Milestones
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {upcomingTasks.map(task => {
                const date = new Date(task.dueDate);
                return (
                  <div key={task.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--surface-container)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(195,198,213,0.3)' }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-label)', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>{format(date, 'MMM')}</span>
                      <span style={{ fontSize: 18, fontFamily: 'var(--font-headline)', color: 'var(--on-surface)', lineHeight: 1 }}>{format(date, 'd')}</span>
                    </div>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'var(--on-surface)' }}>{task.title}</h4>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                        {format(date, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
              {upcomingTasks.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', textAlign: 'center' }}>No upcoming milestones</p>
              )}
            </div>
          </div>
        )}

        {/* Empty State visual */}
        {!selectedDay && upcomingTasks.length === 0 && (
          <div className="glass-card" style={{ padding: 24, background: 'rgba(219, 218, 219, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flex: 1, minHeight: 200 }}>
            <div style={{ width: 64, height: 64, background: 'var(--surface-container-highest)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>inbox</span>
            </div>
            <h4 style={{ fontFamily: 'var(--font-headline)', fontSize: 16, color: 'var(--on-surface)' }}>No Pending Tasks</h4>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--on-surface-variant)', marginTop: 8, maxWidth: 200 }}>Your scholarly agenda is clear.</p>
          </div>
        )}

      </aside>
    </div>
  );
}
