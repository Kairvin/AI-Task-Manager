import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getMonthDays, getWeekDays, isSameDay, isSameMonth, isToday, format, DAYS_SHORT } from '../utils/dateUtils';

export default function CalendarView({ onDayClick, currentDate, viewMode }) {
  const { tasks } = useApp();
  const days = viewMode === 'week' ? getWeekDays(currentDate) : getMonthDays(currentDate);

  const getTasksForDay = (day) => {
    return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
  };

  return (
    <div className="calendar-grid">
      {/* Day headers */}
      <div className="calendar-header-row" style={{ gridColumn: '1 / -1' }}>
        {DAYS_SHORT.map(d => (
          <div key={d} className="calendar-header-cell">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      {days.map((day, i) => {
        const dayTasks = getTasksForDay(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isCurrentDay = isToday(day);

        return (
          <div
            key={i}
            className="calendar-cell"
            onClick={() => onDayClick?.(day)}
            style={{ opacity: isCurrentMonth ? 1 : 0.4 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className={`calendar-day-num ${isCurrentDay ? 'today' : ''} ${!isCurrentMonth ? 'muted' : ''}`}>
                {format(day, 'd')}
              </span>
              {isCurrentDay && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', marginTop: 8, marginRight: 4 }} />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
              {dayTasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  className="calendar-event"
                  style={{
                    background: task.priority === 'high' || task.priority === 'critical' ? 'var(--primary-fixed)' : 'var(--surface-container-high)',
                    color: task.priority === 'high' || task.priority === 'critical' ? 'var(--on-primary-fixed)' : 'var(--on-surface)',
                    border: `1px solid ${task.priority === 'high' || task.priority === 'critical' ? 'rgba(9, 76, 178, 0.1)' : 'var(--outline-variant)'}`
                  }}
                >
                  {task.title}
                </div>
              ))}
              {dayTasks.length > 3 && (
                <span style={{ fontSize: 10, fontFamily: 'var(--font-label)', color: 'var(--on-surface-variant)', paddingLeft: 4 }}>
                  +{dayTasks.length - 3} more
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
