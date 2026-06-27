import '../pages/Tasks.css';
import { useApp } from '../context/AppContext';
import { getRelativeTime, getDueStatus } from '../utils/dateUtils';
import PriorityBadge from './PriorityBadge';

export default function TaskCard({ task, onClick }) {
  const { toggleTask, deleteTask } = useApp();
  const dueStatus = getDueStatus(task.dueDate, task.completed, task.completedAt);

  const handleCheck = (e) => {
    e.stopPropagation();
    toggleTask(task.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  return (
    <div className="task-card group" onClick={() => onClick?.(task)}>
      <div className={`task-card-priority ${task.priority}`}></div>
      
      <button
        className={`task-card-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={handleCheck}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        <span className="material-symbols-outlined" style={{ 
          fontSize: 14, 
          color: task.completed ? 'var(--on-primary)' : 'transparent',
          fontVariationSettings: "'FILL' 1"
        }}>
          check
        </span>
      </button>

      <div className="task-card-body">
        <p className={`task-card-title ${task.completed ? 'completed' : ''}`}>
          {task.title}
        </p>
        <div className="task-card-meta">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && dueStatus !== 'completed' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: dueStatus === 'overdue' ? 'var(--error)' : ((dueStatus === 'urgent' || dueStatus === 'soon') ? 'var(--primary)' : 'var(--on-surface-variant)') }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
              <span style={{ fontWeight: dueStatus === 'overdue' || dueStatus === 'urgent' || dueStatus === 'soon' ? 600 : 400 }}>
                {dueStatus === 'overdue' ? 'Overdue' : getRelativeTime(task.dueDate)}
              </span>
            </div>
          )}
          {task.category && (
            <span style={{ 
              background: 'var(--surface-container-highest)', 
              padding: '2px 8px', 
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-label)',
              fontSize: 11,
            }}>
              {task.category}
            </span>
          )}
          {task.assigneeId && (
            <span style={{ 
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--primary-container)', 
              color: 'var(--on-primary-container)',
              padding: '2px 8px', 
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-label)',
              fontSize: 11,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>person</span>
              Assigned
            </span>
          )}
        </div>
      </div>

      <button
        className="btn-ghost btn-icon"
        onClick={handleDelete}
        style={{ opacity: 0, transition: 'opacity 0.2s', flexShrink: 0 }}
        aria-label="Delete task"
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
      </button>
      
      <style>{`
        .task-card:hover .btn-icon {
          opacity: 0.6 !important;
        }
        .task-card .btn-icon:hover {
          opacity: 1 !important;
          color: var(--error);
        }
        @media (max-width: 1024px) {
          .task-card .btn-icon {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
